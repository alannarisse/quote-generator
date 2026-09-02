import { Routes } from '@angular/router';
import { RandomQuoteComponent } from './components/random-quote/random-quote.component';
import { QuoteListComponent } from './components/quote-list/quote-list.component';
import { AddQuoteComponent } from './components/add-quote/add-quote.component';

export const routes: Routes = [
  { path: '', component: RandomQuoteComponent },
  { path: 'quotes', component: QuoteListComponent },
  { path: 'add', component: AddQuoteComponent },
  { path: '**', redirectTo: '' }
];
