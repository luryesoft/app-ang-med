//import { bootstrapApplication } from '@angular/platform-browser';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { AppModule } from './app/app.module';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(AppModule), provideAnimationsAsync('noop')
  ]
}).catch(err => console.error(err));