@@ .. @@
        <div className="glass-effect gradient-border p-6 rounded-lg">
          <div className="flex flex-col gap-4">
            {error && (
          )
          }
-              <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg">
+              <div className="bg-red-500/20 text-white px-4 py-2 rounded-lg">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
-                <label className="block text-indigo-200 mb-2">Symbol</label>
+                <label className="block text-white mb-2">Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
@@ .. @@
              </div>
              <div>
-                <label className="block text-indigo-200 mb-2">Interval</label>
+                <label className="block text-white mb-2">Interval</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
@@ .. @@
              </div>
              <div>
-                <label className="block text-indigo-200 mb-2">Theme</label>
+                <label className="block text-white mb-2">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
@@ .. @@
                <div className="p-4 rounded-lg bg-gray-800/50 space-y-4">
                  <div>
-                    <h3 className="text-indigo-200 font-semibold mb-2">Chart-img API URL:</h3>
-                    <code className="text-sm text-indigo-100 break-all">{decodedUrl}</code>
+                    <h3 className="text-white font-semibold mb-2">Chart-img API URL:</h3>
+                    <code className="text-sm text-white break-all">{decodedUrl}</code>
                  </div>
                  <div>
-                    <h3 className="text-indigo-200 font-semibold mb-2">Preview URL:</h3>
-                    <code className="text-sm text-indigo-100 break-all">{previewUrl}</code>
+                    <h3 className="text-white font-semibold mb-2">Preview URL:</h3>
+                    <code className="text-sm text-white break-all">{previewUrl}</code>
                  </div>
                </div>