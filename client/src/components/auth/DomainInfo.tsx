import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DomainInfo() {
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    setCurrentDomain(window.location.hostname);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Domain copied to clipboard",
      });
    });
  };

  return (
    <Card className="max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Firebase Domain Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Current Domain:</h4>
          <div className="flex items-center gap-2">
            <code className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-sm flex-1">
              {currentDomain}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(currentDomain)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h5 className="font-medium mb-2">Complete Firebase Setup:</h5>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Go to{' '}
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
            <li>Go to <strong>Authentication</strong> → <strong>Sign-in method</strong></li>
            <li>Find <strong>"Google"</strong> and click <strong>"Enable"</strong></li>
            <li>Add a support email if prompted</li>
            <li>Click <strong>"Save"</strong></li>
            <li>Go to <strong>Authentication</strong> → <strong>Settings</strong> → <strong>Authorized domains</strong></li>
            <li>Click <strong>"Add domain"</strong></li>
            <li>Paste: <code className="bg-white dark:bg-gray-800 px-1 rounded">{currentDomain}</code></li>
            <li>Click <strong>"Add"</strong></li>
            <li>Return here and try Google sign-in again</li>
          </ol>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <h5 className="font-medium mb-2 text-red-700 dark:text-red-300">Getting "Operation not allowed" error?</h5>
          <p className="text-sm text-red-600 dark:text-red-400">
            This usually means Google sign-in method is not enabled in Firebase. Make sure you complete step 4 above to enable Google authentication.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Note:</strong> Also add <code>localhost</code> for local testing if needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}