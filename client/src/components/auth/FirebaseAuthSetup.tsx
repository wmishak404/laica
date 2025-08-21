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
            <h4 className="font-semibold mb-2">Current Domain to Add:</h4>
            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
              {currentDomain}
            </code>
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
              <strong>Note:</strong> You may also need to add additional domains when you deploy to production 
              (like your .replit.app domain or custom domain).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}