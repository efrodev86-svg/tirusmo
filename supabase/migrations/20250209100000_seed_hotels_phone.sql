-- Llenar teléfono de contacto en cada hotel (números de ejemplo por ubicación)
UPDATE public.hotels SET phone = '+52 998 123 4567' WHERE name = 'Grand Fiesta Americana Coral Beach';
UPDATE public.hotels SET phone = '+52 998 234 5678' WHERE name = 'Hotel Marriott CasaMagna';
UPDATE public.hotels SET phone = '+52 55 1234 5678' WHERE name = 'Hyatt Regency México';
UPDATE public.hotels SET phone = '+52 415 152 3456' WHERE name = 'Casa de Sierra Nevada';
UPDATE public.hotels SET phone = '+52 322 123 4567' WHERE name = 'Villa del Palmar Flamingos';
UPDATE public.hotels SET phone = '+52 954 123 4567' WHERE name = 'Hotel Escondido';
UPDATE public.hotels SET phone = '+52 624 123 4567' WHERE name = 'Las Ventanas al Paraíso';
UPDATE public.hotels SET phone = '+52 999 123 4567' WHERE name = 'Hacienda Xcanatún';
UPDATE public.hotels SET phone = '+52 415 152 4567' WHERE name = 'Hotel Matilda';
UPDATE public.hotels SET phone = '+52 984 123 4567' WHERE name = 'Banyan Tree Mayakoba';
UPDATE public.hotels SET phone = '+52 951 123 4567' WHERE name = 'Quinta Real Oaxaca';
UPDATE public.hotels SET phone = '+52 81 1234 5678' WHERE name = 'Hotel Habita Monterrey';
UPDATE public.hotels SET phone = '+52 624 234 5678' WHERE name = 'Villa del Arco Cabo';
UPDATE public.hotels SET phone = '+52 951 234 5678' WHERE name = 'Casa Oaxaca';
UPDATE public.hotels SET phone = '+52 55 2345 6789' WHERE name = 'Hotel Marqués Reforma';
UPDATE public.hotels SET phone = '+52 624 345 6789' WHERE name = 'One&Only Palmilla';
UPDATE public.hotels SET phone = '+52 984 234 5678' WHERE name = 'Hotel Azul Tulum';
UPDATE public.hotels SET phone = '+52 998 345 6789' WHERE name = 'Casa de los Sueños';
UPDATE public.hotels SET phone = '+52 647 123 4567' WHERE name = 'Hacienda de los Santos';
UPDATE public.hotels SET phone = '+52 984 345 6789' WHERE name = 'Hotel Esencia';

-- Cualquier otro hotel sin teléfono (por si se agregaron después) recibe un número genérico
UPDATE public.hotels SET phone = '+52 55 0000 0000' WHERE phone IS NULL;
