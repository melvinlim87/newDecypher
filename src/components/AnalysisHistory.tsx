@@ .. @@
                        <div className="flex items-center">
-                          <h3 className={`text-lg font-medium truncate ${theme === 'dark' ? 'text-cyan-300' : 'text-cyan-300'}`}
+                          <h3 className={`text-lg font-medium truncate text-white`}
                              style={theme === 'light' ? {textShadow: '0 0 5px rgba(0, 229, 255, 0.5)'} : {}}>
                            {item.title || 'Market Analysis'}
                          </h3>
@@ .. @@
                      <div className={`flex items-center mt-1 text-sm ${
-                        theme === 'dark' ? 'text-cyan-500' : 'text-cyan-500'
+                        'text-white'
                      }`}>
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(item.timestamp).toLocaleString()}
                        {item.timeframe && (
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
-                            theme === 'dark' 
-                              ? 'bg-cyan-900/50 text-cyan-300' 
-                              : 'bg-blue-100 text-blue-700'
+                            'bg-cyan-900/50 text-white'
                          }`}
                          style={theme === 'light' ? {
                            background: 'rgba(0, 229, 255, 0.15)',
                            boxShadow: '0 0 5px rgba(0, 229, 255, 0.3)',
                            textShadow: '0 0 2px rgba(0, 229, 255, 0.5)'
                          } : {}}>
                            {formatTimeframe(item.timeframe)}
                          </span>
                        )}
                        {item.model && (
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
-                            theme === 'dark' 
-                              ? 'bg-gray-700 text-gray-300' 
-                              : 'bg-gray-200 text-gray-700'
+                            'bg-gray-700 text-white'
                          }`}
                          style={theme === 'light' ? {
                            background: 'rgba(0, 229, 255, 0.1)',
                            border: '1px solid rgba(0, 229, 255, 0.2)',
                            boxShadow: '0 0 5px rgba(0, 229, 255, 0.2)'
                          } : {}}>
                            {item.model}
                          </span>
                        )}
                      </div>
@@ .. @@
                      <div className={`p-4 rounded text-sm max-h-[400px] overflow-y-auto whitespace-pre-wrap ${
                        theme === 'dark' 
-                          ? 'bg-gray-700/50 text-cyan-300 border border-gray-600' 
-                          : 'bg-white text-gray-800 border border-gray-200'
+                          ? 'bg-gray-700/50 text-white border border-gray-600' 
+                          : 'bg-white text-white border border-gray-200'
                      }`}
                      style={theme === 'light' ? {
                        background: 'rgba(10, 25, 47, 0.7)',
                        border: '1px solid rgba(0, 229, 255, 0.2)',
                        color: '#e0ffff',
                        boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.2)'
                      } : {}}>
@@ .. @@
                                  <div 
                                    key={index} 
                                    className={`${
-                                      message.role === 'assistant' 
-                                        ? theme === 'dark' ? 'text-cyan-200' : 'text-cyan-200'
-                                        : theme === 'dark' ? 'text-cyan-400' : 'text-cyan-400'
+                                      'text-white'
                                    }`}
                                    style={theme === 'light' && message.role === 'assistant' ? {
                                      textShadow: '0 0 3px rgba(0, 229, 255, 0.3)'
                                    } : {}}>
                                    <span className="font-bold">
                                      {message.role === 'assistant' ? 'AI: ' : 'You: '}
                                    </span>
                                    {message.content}
                                  </div>
                                ))}
                              </div>
                            ) : (
-                              <div className={`italic ${
-                                theme === 'dark' ? 'text-cyan-500' : 'text-cyan-500'
-                              }`}>
+                              <div className="italic text-white">
                                No content available for this EA.
                              </div>
                            )}
                          </div>
@@ .. @@
                        <div className="mt-4">
                          <div className={`flex items-center justify-between mb-2 ${
-                            theme === 'dark' ? 'text-cyan-300' : 'text-cyan-300'
+                            'text-white'
                          }`}
                          style={theme === 'light' ? {textShadow: '0 0 5px rgba(0, 229, 255, 0.5)'} : {}}>
                            <h4 className="font-medium">Chart Images:</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.chartUrls.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`Chart ${index + 1}`}
                                className={`rounded border max-h-40 object-contain ${
                                  theme === 'dark' 
                                    ? 'border-cyan-800/50 bg-black/70' 
                                    : 'border-cyan-300/30 bg-white'
                                }`}
                                style={theme === 'light' ? {
                                  boxShadow: '0 0 15px rgba(0, 229, 255, 0.3)'
                                } : {}}
                              />
                            ))}
                          </div>
                        </div>
                      )}