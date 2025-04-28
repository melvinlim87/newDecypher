@@ .. @@
        <div className="glass-effect gradient-border rounded-lg p-6 bg-gray-900/50 relative z-10">
          {/* Market Carousel */}
          <div className="space-y-4">
-            <h2 className="text-2xl font-semibold text-gray-100">
+            <h2 className="text-2xl font-semibold text-white">
              {category === 'forex' ? 'Popular Forex Pairs' :
               category === 'indexes' ? 'Major Indexes' :
               'Popular CFDs'}
@@ .. @@
          <div className="mt-8 rounded-lg p-4 bg-gray-800/50 border border-gray-700/50">
            <div className="flex items-center gap-4">
-              <h1 className="text-2xl font-semibold text-gray-100">
+              <h1 className="text-2xl font-semibold text-white">
                {symbol === 'GOLD' ? 'GOLD' : symbol?.replace('-', '/')}
              </h1>