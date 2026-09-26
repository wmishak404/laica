import type { Express, RequestHandler } from "express";
import { z } from "zod";
import { actionIdSchema, actionReferenceSchema, actionResponseSchema } from "@shared/cooking-actions";
import { getCookingAssistance } from "../openai";
import { actionReceiptUserLimit, actionStatusUserLimit, voiceUserDayLimit, voiceUserHourLimit } from "../rate-limit";
import { createCookingActionService } from "./service";
import { createPostgresActionLedger } from "./postgres-ledger";
import { ActionError } from "./ledger";
import type { ActionCaller } from "./policy";

type Service = ReturnType<typeof createCookingActionService>;
export function registerCookingActionRoutes(app: Express, authenticate: RequestHandler, service?: Service) {
  const actions = service ?? createCookingActionService({
    ledger: createPostgresActionLedger(),
    propose: input => getCookingAssistance(input.context.step, input.utterance, { actionProposal: true }),
  });
  const handler = (operation: (caller: ActionCaller, req: any) => Promise<unknown>, responseSchema = true): RequestHandler => async (req: any, res) => {
    try {
      const user = req.firebaseUser;
      if (!user?.uid) return res.status(401).json({ type: "blocked", reason: "unavailable" });
      const caller: ActionCaller = { uid: user.uid, isAnonymous: user.isAnonymous === true, caller: "live_cooking" };
      const response = await operation(caller, req);
      return res.json(responseSchema ? actionResponseSchema.parse(response) : response);
    } catch (error) {
      const reason = error instanceof ActionError ? error.reason : error instanceof z.ZodError ? "invalid_request" : "ledger_unavailable";
      const status = error instanceof ActionError ? error.status : error instanceof z.ZodError ? 400 : 503;
      // Error objects may include SQL parameters, transcripts or provider payloads. Never log/serialize them.
      return res.status(status).json({ type: "blocked", reason });
    }
  };
  const root = "/api/cooking/actions";
  app.use(root, (_req, res, next) => {
    res.set({ "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache" });
    res.vary("Authorization"); next();
  }, authenticate);
  app.get(`${root}/capabilities`, actionStatusUserLimit, handler((caller, req) => {
    const query = z.object({ sessionId: z.coerce.number().int().positive() }).strict().parse(req.query);
    return actions.capabilities(caller, query.sessionId);
  }, false));
  app.post(`${root}/propose`, voiceUserHourLimit, voiceUserDayLimit, handler((caller, req) => actions.propose(caller, req.body)));
  app.post(`${root}/confirm`, voiceUserHourLimit, voiceUserDayLimit, handler((caller, req) => actions.confirm(caller, req.body)));
  app.post(`${root}/cancel`, actionStatusUserLimit, handler((caller, req) => {
    const input = actionReferenceSchema.parse(req.body);
    return actions.cancel(caller, input.actionId, input.scope);
  }));
  app.get(`${root}/:actionId`, actionStatusUserLimit, handler((caller, req) => actions.status(caller, actionIdSchema.parse(req.params.actionId))));
  app.post(`${root}/:actionId/result`, actionReceiptUserLimit, handler((caller, req) => actions.receipt(caller, actionIdSchema.parse(req.params.actionId), req.body)));
}
