@@ .. @@
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6 text-indigo-400" />
              Select Model
            </h2>
@@ .. @@
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <LineChart className="w-6 h-6 text-indigo-400" />
              Select Symbol
            </h2>
@@ .. @@
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Timer className="w-6 h-6 text-indigo-400" />
              Select Timeframe
            </h2>
@@ .. @@
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Gauge className="w-6 h-6 text-indigo-400" />
              Technical Indicators
            </h2>
@@ .. @@
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6 text-indigo-400" />
              Chart Preview
            </h2>
@@ .. @@
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center mb-4">
                    <span className="text-2xl opacity-50">🎯</span>
                    <span className="text-2xl opacity-50">📊</span>
                  </div>
-                  <p className="text-gray-400">No technical indicators available</p>
-                  <p className="text-sm text-gray-500 mt-2">Technical indicators will appear here when detected in the chart</p>
+                  <p className="text-white">No technical indicators available</p>
+                  <p className="text-sm text-white opacity-70 mt-2">Technical indicators will appear here when detected in the chart</p>
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
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-red-500/20 p-1.5 rounded">
                    <Target className="w-4 h-4 text-red-400" />
                  </div>
-                  <h3 className="text-lg font-medium text-white">RSI INDICATOR</h3>
+                  <h3 className="text-lg font-medium text-white">RSI INDICATOR</h3>
                </div>

                <div className="space-y-4">
                  <div>
-                    <h4 className="text-indigo-300 text-sm mb-1">Current Values</h4>
+                    <h4 className="text-white text-sm mb-1">Current Values</h4>
                    <div className="text-white">
                      {analyses[0] && parseAnalysis(analyses[0]).rsi?.value || 'Not Visible'}
                    </div>
                  </div>
                  <div>
-                    <h4 className="text-indigo-300 text-sm mb-1">Signal</h4>
+                    <h4 className="text-white text-sm mb-1">Signal</h4>
                    <div className="text-white">
                      {analyses[0] && parseAnalysis(analyses[0]).rsi?.signal || '-'}
                    </div>
                  </div>
                  <div>
-                    <h4 className="text-indigo-300 text-sm mb-1">Analysis</h4>
+                    <h4 className="text-white text-sm mb-1">Analysis</h4>
                    <div className="text-white">
                      {analyses[0] && parseAnalysis(analyses[0]).rsi?.analysis || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* MACD Indicator */}
              <div className="glass-effect gradient-border rounded-lg p-4 bg-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-blue-500/20 p-1.5 rounded">
                    <LineChart className="w-4 h-4 text-blue-400" />
                  </div>
-                  <h3 className="text-lg font-medium text-white">MACD INDICATOR</h3>
+                  <h3 className="text-lg font-medium text-white">MACD INDICATOR</h3>
                </div>

                <div className="space-y-4">
                  <div>
-                    <h4 className="text-indigo-300 text-sm mb-1">Current Values</h4>
+                    <h4 className="text-white text-sm mb-1">Current Values</h4>
                    <div className="text-white">
                      {analyses[0] && parseAnalysis(analyses[0]).macd?.value || 'Not Visible'}
                    </div>
                  </div>
                  <div>
-                    <h4 className="text-indigo-300 text-sm mb-1">Signal</h4>
+                    <h4 className="text-white text-sm mb-1">Signal</h4>
                    <div className="text-white">
                      {analyses[0] && parseAnalysis(analyses[0]).macd?.signal || '-'}
                    </div>
                  </div>
                  <div>
-                    <h4 className="text-indigo-300 text-sm mb-1">Analysis</h4>
+                    <h4 className="text-white text-sm mb-1">Analysis</h4>
                    <div className="text-white">
                      {analyses[0] && parseAnalysis(analyses[0]).macd?.analysis || '-'}
                    </div>
                  </div>
                </div>
              </div>
@@ .. @@
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                    <Target className="w-5 h-5 text-indigo-400" />
                  </div>
-                  <h2 className="text-2xl font-bold text-white">Trading Signal</h2>
+                  <h2 className="text-2xl font-bold text-white">Trading Signal</h2>
                </div>

                {/* Signal Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Action Panel */}
                  <div className="bg-white/5 rounded-xl p-6 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10">
-                    <h3 className="text-gray-300 mb-3">Action</h3>
+                    <h3 className="text-white mb-3">Action</h3>
                    <div className={`text-2xl font-bold ${
                      correlativeAnalysis.signals.primary.toLowerCase().includes('buy') ? 'text-emerald-400' :
                      correlativeAnalysis.signals.primary.toLowerCase().includes('sell') ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {correlativeAnalysis.signals.primary}
                    </div>
                  </div>

                  {/* Entry Price Panel */}
                  <div className="bg-white/5 rounded-xl p-6 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10">
-                    <h3 className="text-gray-300 mb-3">Entry Price</h3>
+                    <h3 className="text-white mb-3">Entry Price</h3>
                    <div className="text-2xl font-bold text-white">
                      {correlativeAnalysis.signals.entryPrice || 'N/A'}
                    </div>
                  </div>

                  {/* Take Profit Panel */}
                  <div className="bg-white/5 rounded-xl p-6 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10">
-                    <h3 className="text-gray-300 mb-3">Take Profit</h3>
+                    <h3 className="text-white mb-3">Take Profit</h3>
                    <div className="text-2xl font-bold text-emerald-400">
                      {correlativeAnalysis.signals.takeProfit || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Technical Analysis Panel */}
                <div className="bg-white/5 rounded-xl p-6 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                      <LineChart className="w-5 h-5 text-indigo-400" />
                    </div>
-                    <h3 className="text-2xl font-bold text-white">Technical Analysis</h3>
+                    <h3 className="text-2xl font-bold text-white">Technical Analysis</h3>
                  </div>

                  <div className="space-y-6">
                    {correlativeAnalysis.summary.split('\n\n').map((section, index) => {
                      if (!section) return null;
                      const [title, ...points] = section.split('\n');
                      return (
                        <div key={index} className="bg-white/5 rounded-xl p-4 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10">
-                          <h4 className="text-lg font-semibold mb-3 text-white">{title || 'Analysis'}</h4>
+                          <h4 className="text-lg font-semibold mb-3 text-white">{title || 'Analysis'}</h4>
                          <div className="space-y-2">
                            {points.map((point, pointIndex) => (
                              <div key={pointIndex} className="flex items-start gap-3">
                                <div className="min-w-2 h-2 w-2 rounded-full bg-indigo-400 mt-2.5"></div>
-                                <p className="text-[#e4e4e7] leading-relaxed">
+                                <p className="text-white leading-relaxed">
                                  {point.replace(/^- /, '')}
                                </p>
                              </div>
                            ))}
                          </div>
                        )
                        )
                        }
                        </div>
                      );
                    })}
                  </div>
                </div>
                    )
                    }

                {/* Confidence Level Panel */}
                <div className="bg-white/5 rounded-xl p-6 shadow-[0_4px_15px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10">
-                  <div className="flex justify-between items-center mb-3">
-                    <h3 className="text-gray-300">Confidence Level</h3>
+                  <div className="flex justify-between items-center mb-3">
+                    <h3 className="text-white">Confidence Level</h3>
                    <span className="text-white font-bold">{correlativeAnalysis.signals?.confidence || 50}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">