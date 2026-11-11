import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localePl from '@angular/common/locales/pl';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { userIdInterceptor } from './core/user-id.interceptor';
import { HttpUserRepository } from './core/data/http-user-repository';
import { InMemoryMealRepository } from './core/data/in-memory-meal-repository';
import { HttpProductRepository } from './core/data/http-product-repository';
import { HttpRecipeRepository } from './core/data/http-recipe-repository';
import { MealRepository } from './core/data/meal-repository';
import { ProductRepository } from './core/data/product-repository';
import { RecipeRepository } from './core/data/recipe-repository';
import { UserRepository } from './core/data/user-repository';

registerLocaleData(localePl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Adresy w postaci /#/history: GitHub Pages zna tylko index.html,
    // więc odświeżenie podstrony bez hasha kończyłoby się błędem 404.
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withFetch(), withInterceptors([userIdInterceptor])),
    { provide: LOCALE_ID, useValue: 'pl' },
    // Dane przykładowe do czasu podpięcia API — klient HTTP podmienia tylko ten provider.
    { provide: MealRepository, useClass: InMemoryMealRepository },
    { provide: RecipeRepository, useClass: HttpRecipeRepository },
    { provide: ProductRepository, useClass: HttpProductRepository },
    { provide: UserRepository, useClass: HttpUserRepository },
  ],
};
