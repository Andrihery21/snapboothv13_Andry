/**
 * Client Supabase avec gestion de limitation de débit (rate limiting)
 * pour éviter les erreurs 429 (Too Many Requests)
 */

import { supabase } from './supabase';
import { executeWithRetry } from './rateLimiter';
import { Logger } from './logger';

const logger = new Logger('SupabaseRateLimited');

/**
 * Client Supabase avec limitation de débit
 * Wrapper autour du client Supabase standard qui ajoute la gestion des erreurs 429
 */
class RateLimitedSupabaseClient {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.storage = this._wrapStorage(supabaseClient.storage);
    this.from = this._wrapFrom(supabaseClient.from.bind(supabaseClient));
    
    // Copier les autres propriétés/méthodes du client Supabase
    this.auth = supabaseClient.auth;
    this.rpc = supabaseClient.rpc;
    this.channel = supabaseClient.channel;
    this.channels = supabaseClient.channels;
    this.getChannels = supabaseClient.getChannels;
    this.removeChannel = supabaseClient.removeChannel;
    this.removeAllChannels = supabaseClient.removeAllChannels;
  }

  /**
   * Wrapper pour la méthode from() qui gère les tables
   */
  _wrapFrom(originalFrom) {
    return (table) => {
      const originalResult = originalFrom(table);
      
      // Wrapper pour les méthodes de requête
      return {
        ...originalResult,
        
        // Méthodes qui modifient les données
        insert: (values, options) => {
          return executeWithRetry(() => originalResult.insert(values, options));
        },
        update: (values, options) => {
          return executeWithRetry(() => originalResult.update(values, options));
        },
        upsert: (values, options) => {
          return executeWithRetry(() => originalResult.upsert(values, options));
        },
        delete: (options) => {
          return executeWithRetry(() => originalResult.delete(options));
        },
        
        // Méthodes de sélection
        select: (columns) => {
          const selectResult = originalResult.select(columns);
          return this._wrapSelectResult(selectResult);
        }
      };
    };
  }

  /**
   * Wrapper pour les résultats de select()
   */
  _wrapSelectResult(selectResult) {
    // Copier toutes les méthodes originales
    const wrappedResult = { ...selectResult };
    
    // Wrapper les méthodes qui exécutent la requête
    const methodsToWrap = ['then', 'single', 'maybeSingle', 'execute'];
    
    methodsToWrap.forEach(method => {
      if (typeof selectResult[method] === 'function') {
        wrappedResult[method] = (...args) => {
          return executeWithRetry(() => selectResult[method](...args));
        };
      }
    });
    
    // Wrapper les méthodes de filtrage qui retournent un nouvel objet
    const filterMethods = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'containedBy', 'filter', 'not', 'or', 'and'];
    
    filterMethods.forEach(method => {
      if (typeof selectResult[method] === 'function') {
        wrappedResult[method] = (...args) => {
          const result = selectResult[method](...args);
          return this._wrapSelectResult(result);
        };
      }
    });
    
    // Wrapper les méthodes de modification
    const modifierMethods = ['limit', 'range', 'order', 'limit'];
    
    modifierMethods.forEach(method => {
      if (typeof selectResult[method] === 'function') {
        wrappedResult[method] = (...args) => {
          const result = selectResult[method](...args);
          return this._wrapSelectResult(result);
        };
      }
    });
    
    return wrappedResult;
  }

  /**
   * Wrapper pour l'API storage
   */
  _wrapStorage(storage) {
    return {
      ...storage,
      from: (bucket) => {
        const originalBucket = storage.from(bucket);
        
        return {
          ...originalBucket,
          // Méthodes de téléchargement
          upload: (path, fileBody, options) => {
            return executeWithRetry(() => originalBucket.upload(path, fileBody, options));
          },
          // Méthodes de téléchargement
          download: (path, options) => {
            return executeWithRetry(() => originalBucket.download(path, options));
          },
          // Méthodes de récupération d'URL
          getPublicUrl: (path, options) => {
            return executeWithRetry(() => originalBucket.getPublicUrl(path, options));
          },
          createSignedUrl: (path, expiresIn, options) => {
            return executeWithRetry(() => originalBucket.createSignedUrl(path, expiresIn, options));
          },
          // Méthodes de suppression
          remove: (paths) => {
            return executeWithRetry(() => originalBucket.remove(paths));
          },
          // Méthodes de liste
          list: (path, options) => {
            return executeWithRetry(() => originalBucket.list(path, options));
          }
        };
      },
      // Méthodes de gestion des buckets
      getBucket: (id) => {
        return executeWithRetry(() => storage.getBucket(id));
      },
      listBuckets: () => {
        return executeWithRetry(() => storage.listBuckets());
      },
      createBucket: (id, options) => {
        return executeWithRetry(() => storage.createBucket(id, options));
      },
      updateBucket: (id, options) => {
        return executeWithRetry(() => storage.updateBucket(id, options));
      },
      emptyBucket: (id) => {
        return executeWithRetry(() => storage.emptyBucket(id));
      },
      deleteBucket: (id) => {
        return executeWithRetry(() => storage.deleteBucket(id));
      }
    };
  }
}

// Créer et exporter une instance du client Supabase avec limitation de débit
const supabaseRateLimited = new RateLimitedSupabaseClient(supabase);

export { supabaseRateLimited };
