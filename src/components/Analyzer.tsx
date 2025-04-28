@@ .. @@
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-center gap-2 justify-center mb-4">
                      <span className="text-2xl opacity-50">🎯</span>
                      <span className="text-2xl opacity-50">📊</span>
                    </div>
-                    <p className="text-gray-400">No technical indicators available</p>
-                    <p className="text-sm text-gray-500 mt-2">Technical indicators will appear here when detected in the chart</p>
+                    <p className="text-white">No technical indicators available</p>
+                    <p className="text-sm text-white opacity-70 mt-2">Technical indicators will appear here when detected in the chart</p>
                  </div>
                </div>
              </div>
@@ .. @@
                  <div className="text-center">
                    <div className="flex items-center gap-2 justify-center mb-4">
                      <span className="text-2xl opacity-50">🎯</span>
                      <span className="text-2xl opacity-50">📊</span>
                    </div>
-                    <p className="text-gray-400">No technical indicators detected</p>
-                    <p className="text-sm text-gray-500 mt-2">Technical indicators will appear here when detected in the chart</p>
+                    <p className="text-white">No technical indicators detected</p>
+                    <p className="text-sm text-white opacity-70 mt-2">Technical indicators will appear here when detected in the chart</p>
                  </div>
                </div>
              </div>
@@ .. @@
                      <div className="glass-effect gradient-border rounded-lg p-4">
-                        <p className="text-sm text-indigo-200 mb-1">Current Price</p>
+                        <p className="text-sm text-white mb-1">Current Price</p>
                        <p className="text-lg font-bold text-white">{extractValue(analysis, 'Current Price')}</p>
                      </div>
                      <div className="glass-effect gradient-border rounded-lg p-4">
-                        <p className="text-sm text-indigo-200 mb-1">Support Levels</p>
+                        <p className="text-sm text-white mb-1">Support Levels</p>
                        <p className="text-lg font-bold text-white">{extractValue(analysis, 'Support Levels')}</p>
                      </div>
                      <div className="glass-effect gradient-border rounded-lg p-4">
-                        <p className="text-sm text-indigo-200 mb-1">Resistance Levels</p>
+                        <p className="text-sm text-white mb-1">Resistance Levels</p>
                        <p className="text-lg font-bold text-white">{extractValue(analysis, 'Resistance Levels')}</p>
                      </div>
@@ .. @@
                        <div className="glass-effect gradient-border rounded-lg p-4">
-                          <p className="text-sm text-indigo-200 mb-1">Current Values</p>
+                          <p className="text-sm text-white mb-1">Current Values</p>
                          <p className="text-lg font-bold text-white">{indicator.currentValues}</p>
                        </div>
                        <div>
-                          <p className="text-sm text-indigo-200 mb-2">Signal</p>
+                          <p className="text-sm text-white mb-2">Signal</p>
                          <p className="text-lg font-bold text-amber-400">{indicator.signal}</p>
                        </div>
                        <div>
-                          <p className="text-sm text-indigo-200 mb-2">Analysis</p>
+                          <p className="text-sm text-white mb-2">Analysis</p>
                          <p className="text-white">{indicator.analysis}</p>
                        </div>
@@ .. @@
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="glass-effect gradient-border rounded-lg p-4">
-                            <p className="text-sm text-indigo-200 mb-1">Action</p>
+                            <p className="text-sm text-white mb-1">Action</p>
                            <p className={`text-lg font-bold ${getActionColor(extractValue(analysis, 'Action'))}`}>
                              {extractValue(analysis, 'Action')}
                            </p>
                          </div>
                          {extractValue(analysis, 'Action') !== 'HOLD' && (
                            <>
                              <div className="glass-effect gradient-border rounded-lg p-4">
-                                <p className="text-sm text-indigo-200 mb-1">Entry Price</p>
+                                <p className="text-sm text-white mb-1">Entry Price</p>
                                <p className="text-lg font-bold text-white">{extractValue(analysis, 'Entry Price')}</p>
                              </div>
                              <div className="glass-effect gradient-border rounded-lg p-4">
-                                <p className="text-sm text-indigo-200 mb-1">Take Profit</p>
+                                <p className="text-sm text-white mb-1">Take Profit</p>
                                <p className="text-lg font-bold text-emerald-400">{extractValue(analysis, 'Take Profit')}</p>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="glass-effect gradient-border rounded-lg p-4 mb-4">
-                          <p className="text-sm text-indigo-200 mb-2">Technical Analysis</p>
+                          <p className="text-sm text-white mb-2">Technical Analysis</p>
                          <div className="space-y-4 text-white">
                            {extractValue(analysis, 'Technical Analysis')?.split(/(?<=[.!?])\s+/)
                              .filter(point => {
                              }
                              )
                            }