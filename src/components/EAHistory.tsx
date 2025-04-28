<div className="flex items-center">
                          <h3 className={`text-lg font-medium truncate text-white`}
                             style={theme === 'light' ? {textShadow: '0 0 5px rgba(0, 229, 255, 0.5)'} : {}}>
                            {item.title || 'Expert Advisor'}
                          </h3>
                        </div>
                      <div className={`flex items-center mt-1 text-sm ${
                        'text-white'
                      }`}>
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(item.timestamp).toLocaleString()}
                        {item.model && (
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                            'bg-gray-700 text-white'
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
                      <div className={`p-4 rounded text-sm max-h-[400px] overflow-y-auto whitespace-pre-wrap ${
                        theme === 'dark' 
                          ? 'bg-gray-700/50 text-white border border-gray-600' 
                          : 'bg-white text-white border border-gray-200'
                      }`}
                      style={theme === 'light' ? {
                        background: 'rgba(10, 25, 47, 0.7)',
                        border: '1px solid rgba(0, 229, 255, 0.2)',
                        color: '#e0ffff',
                        boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.2)'
                      } : {}}>
                        {item.messages ? (
                          <div>
                            {item.messages.map((message, index) => (
                              <div 
                                key={index} 
                                className={`${
                                  'text-white'
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
                          <div className="italic text-white">
                            No content available for this EA.
                          </div>
                        )}
                      </div>
                      {item.code && (
                        <div className="mt-4">
                          <div className={`flex items-center justify-between mb-2 ${
                            'text-white'
                          }`}
                          style={theme === 'light' ? {textShadow: '0 0 5px rgba(0, 229, 255, 0.5)'} : {}}>
                            <h4 className="font-medium">Generated Code</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCode(item.code);
                              }}
                              className={`flex items-center text-sm ${
                                theme === 'dark' 
                                  ? 'text-white hover:text-white' 
                                  : 'text-white hover:text-white'
                              }`}
                              style={theme === 'light' ? {
                                textShadow: '0 0 3px rgba(0, 229, 255, 0.5)'
                              } : {}}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Code
                            </button>
                          </div>
                          <div className={`p-4 rounded text-sm whitespace-pre-wrap ${
                            theme === 'dark' 
                              ? 'bg-gray-700/50 text-white border border-gray-600' 
                              : 'bg-white text-white border border-gray-200'
                          }`}
                          style={theme === 'light' ? {
                            background: 'rgba(10, 25, 47, 0.7)',
                            border: '1px solid rgba(0, 229, 255, 0.2)',
                            color: '#e0ffff',
                            boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.2)'
                          } : {}}>
                            {item.code}
                          </div>
                        </div>
                      )}