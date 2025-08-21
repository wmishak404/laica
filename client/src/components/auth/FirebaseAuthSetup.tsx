import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export function FirebaseAuthSetup() {
  const currentDomain = window.location.hostname;
  const currentUrl = window.location.origin;

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Firebase Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            To use Google sign-in, you need to add your current domain to Firebase's authorized domains list.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Exact Domain to Add:</h4>
            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
              {currentDomain}
            </code>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Note: Firebase doesn't support wildcard domains. You must add the exact domain above.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Steps to Fix:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Go to the{' '}
                <a 
                  href="https://console.firebase.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Firebase Console <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Select your project</li>
              <li>Go to <strong>Authentication</strong> → <strong>Settings</strong> → <strong>Authorized domains</strong></li>
              <li>Click <strong>"Add domain"</strong></li>
              <li>Add: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{currentDomain}</code></li>
              <li>Click <strong>"Add"</strong> to save</li>
              <li>Refresh this page and try signing in again</li>
            </ol>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Important:</strong> Firebase requires exact domains, not wildcards. 
              When you deploy to production, you'll need to add your specific .replit.app domain 
              (e.g., "your-app-name.username.replit.app") separately.
            </p>
          </div>

          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Common Domains to Add:</h5>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              <li>• <code>localhost</code> (for local testing)</li>
              <li>• Your current dev domain: <code>{currentDomain}</code></li>
              <li>• Your deployed app domain (when you deploy)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}