/**
 * ES MODULES LOADER - IAPRENDER TESTS
 * 
 * Loader customizado para suporte a ES modules em testes Jest
 */

export async function resolve(specifier, context, defaultResolve) {
  // Permitir imports de módulos de teste
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return defaultResolve(specifier, context);
  }
  
  // Mapear módulos node_modules
  if (specifier === '@jest/globals') {
    return defaultResolve(specifier, context);
  }
  
  if (specifier === 'jsdom') {
    return defaultResolve(specifier, context);
  }
  
  if (specifier === 'node-fetch') {
    return defaultResolve(specifier, context);
  }
  
  return defaultResolve(specifier, context);
}

export async function load(url, context, defaultLoad) {
  return defaultLoad(url, context);
}