import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

// Defina a configuração da conexão, apontando para o seu servidor
const config: SocketIoConfig = {
  url: 'http://127.0.0.1:5000',
  options: { transports: ['websocket'] }
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),

    // Adicione o provider do Socket.IO aqui
    importProvidersFrom(SocketIoModule.forRoot(config))
  ]
};