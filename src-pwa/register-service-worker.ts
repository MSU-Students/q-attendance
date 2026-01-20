import { register } from 'register-service-worker';
import { Notify } from 'quasar';
import { mdiCached } from '@quasar/extras/mdi-v6';


// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

register(process.env.SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  ready(/* registration */) {
    // console.log('Service worker is active.')
  },

  registered(/* registration */) {
    // console.log('Service worker has been registered.')
  },

  cached(/* registration */) {
    // console.log('Content has been cached for offline use.')
  },

  updatefound(/* registration */) {
    // console.log('New content is downloading.')
    Notify.create({
      color: 'info',
      icon: mdiCached,
      message: 'Update is available. downloading.',
      position: 'bottom',
    });
  },

  updated(registration) {
    Notify.create({
      color: 'warning',
      icon: mdiCached,
      message: 'Update is available. Please reload the app.',
      timeout: 0,
      multiLine: true,
      position: 'bottom',
      actions: [
        {
          label: 'Update Now',
          color: 'yellow',
          handler: () => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }
        },
        {
          label: 'Dismiss',
          color: 'white',
          handler: () => {
            //
          }
        }
      ]
    })
  },

  offline() {
    // console.log('No internet connection found. App is running in offline mode.')
  },

  error(/* err */) {
    // console.error('Error during service worker registration:', err)
  },
});
