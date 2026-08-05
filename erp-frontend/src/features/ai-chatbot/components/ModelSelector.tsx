import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, Zap, Brain } from 'lucide-react';
import { chatbotApi } from '../services/chatbotApi';
import type { LLMProvider, ProvidersResponse } from '../types';
import { toast } from 'sonner';

interface ModelSelectorProps {
  selectedProvider?: string;
  selectedModel?: string;
  onProviderChange: (provider: string, model: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedProvider,
  selectedModel,
  onProviderChange,
}) => {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [defaultProvider, setDefaultProvider] = useState<string>('openai');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentProvider = selectedProvider || defaultProvider;
  const currentModel = selectedModel || 'default';

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      const data: ProvidersResponse = await chatbotApi.getProviders();
      setProviders(data.providers);
      setDefaultProvider(data.default_provider || 'openai');
    } catch (error: any) {
      console.error('Failed to load providers:', error);
      toast.error('Failed to load available models');
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'openai':
        return <Brain className="h-4 w-4" />;
      case 'huggingface':
        return <Zap className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getProviderInfo = (providerName: string) => {
    return providers.find((p) => p.name === providerName);
  };

  const handleProviderSelect = (providerName: string, modelName: string) => {
    onProviderChange(providerName, modelName);
    setIsOpen(false);
  };

  const currentProviderInfo = getProviderInfo(currentProvider);
  const displayName = currentProviderInfo?.display_name || currentProvider;
  const currentModelDisplay = currentModel === 'default' 
    ? (currentProviderInfo?.models[0] || 'default')
    : currentModel;

  if (isLoading) {
    return (
      <div className="px-3 py-2 text-sm text-slate-500 bg-slate-50 rounded-lg">
        Loading models...
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        title={`Current model: ${displayName} - ${currentModelDisplay}`}
      >
        {getProviderIcon(currentProvider)}
        <span className="hidden sm:inline">{displayName}</span>
        <span className="text-xs text-slate-500 hidden md:inline">
          ({currentModelDisplay})
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Select AI Model
              </div>

              {providers.map((provider) => (
                <div key={provider.name} className="mb-1">
                  <div className="px-3 py-2 text-xs font-medium text-slate-700 flex items-center gap-2">
                    {getProviderIcon(provider.name)}
                    <span>{provider.display_name}</span>
                    {provider.note && (
                      <span className="ml-auto text-xs text-slate-400">
                        {provider.note}
                      </span>
                    )}
                  </div>
                  
                  {provider.models.length > 0 ? (
                    provider.models.map((model) => {
                      const isSelected =
                        currentProvider === provider.name &&
                        (currentModel === model || 
                         (currentModel === 'default' && model === provider.models[0]));

                      return (
                        <button
                          key={model}
                          onClick={() => handleProviderSelect(provider.name, model)}
                          className={`w-full text-left px-6 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{model}</span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary-600" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <button
                      onClick={() => handleProviderSelect(provider.name, 'default')}
                      className={`w-full text-left px-6 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                        currentProvider === provider.name
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Default</span>
                      {currentProvider === provider.name && (
                        <Check className="h-4 w-4 text-primary-600" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

