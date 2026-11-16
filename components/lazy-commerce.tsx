'use client';
import dynamic from 'next/dynamic';

// Forms and gallery dialogs are requested only when the visitor opens one.
export const ProductModal = dynamic(() => import('./commerce-dialogs').then(module => module.ProductModal));
export const QuoteModal = dynamic(() => import('./commerce-dialogs').then(module => module.QuoteModal));
