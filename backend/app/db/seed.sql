--
-- PostgreSQL database dump
--

\restrict CDD8RebavSTkKxUz5otpfsvJAohBMgkXshpXv7dIcYp2QGKVJtuymr7S1wCjl75

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, description, image_url, is_active, created_at, updated_at) FROM stdin;
1	Mobiles	mobiles	5G Flagships, Titanium bodies & Pro camera smartphones.	/assets/exact/cat_mobiles.png	t	2026-11-23 11:16:36.901749+05:30	2026-11-23 11:16:36.901762+05:30
2	Laptops	laptops	M-series chipsets, OLED ultrabooks & discrete RTX workstations.	/assets/exact/cat_laptops.png	t	2026-11-23 11:16:36.904168+05:30	2026-11-23 11:16:36.90417+05:30
3	Headphones	headphones	Studio acoustic monitors & Active Noise-Canceling wireless headphones.	/assets/exact/cat_headphones.png	t	2026-11-23 11:16:36.905019+05:30	2026-11-23 11:16:36.90502+05:30
4	Earbuds	earbuds	TWS wireless in-ear earbuds with Hi-Res spatial audio and charging cases.	/assets/exact/cat_earbuds.png	t	2026-11-23 11:16:36.905949+05:30	2026-11-23 11:16:36.90595+05:30
5	Smart Watches	smartwatches	Cellular health monitors, aerospace titanium cases & AMOLED smartwatches.	/assets/exact/cat_smartwatches.png	t	2026-11-23 11:16:36.906863+05:30	2026-11-23 11:16:36.906865+05:30
6	Accessories	accessories	GaN fast charging docks, Thunderbolt 4 hubs & braided USB-C cables.	/assets/exact/cat_accessories.png	t	2026-11-23 11:16:36.907761+05:30	2026-11-23 11:16:36.907763+05:30
7	Audio	audio	Studio monitors, ANC wireless headphones, and hi-res earbuds.	/assets/exact/cat_headphones.png	t	2026-11-23 11:16:36.908657+05:30	2026-11-23 11:16:36.908658+05:30
8	Smart Home	smart-home	Connected smart displays, IoT automated hubs & surveillance.	/assets/exact/cat_accessories.png	t	2026-11-23 11:16:36.909417+05:30	2026-11-23 11:16:36.909418+05:30
9	Gaming Consoles	gaming-consoles	Updated next-gen console ecosystem	https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800	t	2026-11-23 11:18:09.98501+05:30	2026-11-23 11:18:10.018955+05:30
10	Fixtured Consoles	fixtured-consoles	Console hardware	\N	t	2026-11-23 11:18:10.248274+05:30	2026-11-23 11:18:10.248276+05:30
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, slug, description, price, original_price, brand, badge, stock, image_url, category_id, is_active, is_featured, rating, reviews_count, created_at, updated_at) FROM stdin;
3	MacBook Air M2	macbook-air-m2	Strikingly thin design with next-generation M2 chip, Liquid Retina display, 1080p FaceTime HD camera, and MagSafe 3 charging.	89999.00	119999.00	Apple	-25%	18	/assets/exact/prod_macbook_full.png	2	t	t	4.90	310	2026-11-23 11:16:36.918857+05:30	2026-11-23 11:16:36.918857+05:30
4	Samsung Galaxy Buds2 Pro	samsung-galaxy-buds2-pro	24-bit Hi-Fi audio for a studio-quality listening experience with intelligent 360 Audio and Enhanced Active Noise Cancellation.	12999.00	19999.00	Samsung	-35%	45	/assets/exact/prod_buds_full.png	4	t	t	4.80	260	2026-11-23 11:16:36.918858+05:30	2026-11-23 11:16:36.918858+05:30
5	Apple Watch Ultra 2 GPS + Cellular 49mm Titanium	apple-watch-ultra-2-gps-cellular	Rugged and capable, crafted from aerospace-grade titanium with precision dual-frequency GPS and up to 36 hours of battery life.	49999.00	59999.00	Apple	-17%	20	/assets/exact/cat_smartwatches.png	5	t	t	4.90	385	2026-11-23 11:16:36.918859+05:30	2026-11-23 11:16:36.918859+05:30
6	Anker GaN 65W High-Speed Fast Wall Charger	anker-gan-65w-fast-charger	Ultra-compact Gallium Nitride 65W USB-C 3-port wall charger for high-speed charging of laptops, phones, and tablets simultaneously.	2999.00	4499.00	Anker	-33%	60	/assets/exact/cat_accessories.png	6	t	t	4.85	190	2026-11-23 11:16:36.91886+05:30	2026-11-23 11:16:36.91886+05:30
1	iPhone 16 Pro	iphone-16-pro	Titanium design with thinner borders, A18 Pro chip, 48MP Fusion camera system, and Camera Control.	79999.00	99999.00	Apple	-20%	25	/assets/exact/prod_iphone_full.png	1	t	t	4.90	512	2026-11-23 11:16:36.918841+05:30	2026-11-23 11:18:06.995155+05:30
2	Sony WH-1000XM5 Wireless Headphones	sony-wh-1000xm5-wireless-headphones	Industry-leading noise cancellation with two processors and eight microphones. 30-hour battery life with 3-minute quick charging.	24999.00	35999.00	Sony	-30%	30	/assets/exact/prod_sony_full.png	3	t	t	4.90	428	2026-11-23 11:16:36.918855+05:30	2026-11-23 11:18:08.254084+05:30
7	Payment Audio Rig	payment-audio-rig	Testing audio gear for payments	150.00	\N	\N	\N	48	\N	1	t	f	4.50	0	2026-11-23 11:18:09.346953+05:30	2026-11-23 11:18:09.503145+05:30
9	PlayStation 5 Pro Custom Edition	playstation-5-pro-custom-edition	High-end gaming console with 2TB NVMe SSD and DualSense wireless controller	679.99	799.99	Sony	FEATURED	25	\N	10	t	t	4.50	0	2026-11-23 11:18:10.729607+05:30	2026-11-23 11:18:10.761211+05:30
8	PlayStation 5 Pro Console	playstation-5-pro-console-fixtured	8K HDR Ultra Gaming System	699.99	\N	Sony	NEW	55	/uploads/products/790d99958ab4_test_ps5_pro.png	10	t	f	4.50	0	2026-11-23 11:18:10.258374+05:30	2026-11-23 11:18:11.739626+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, username, full_name, phone, store_name, hashed_password, role, is_active, is_admin, avatar_url, created_at, updated_at) FROM stdin;
1	admin@cloudcart.com	admin	CloudCart Super Admin	+1 (555) 019-2831	\N	$2b$12$V3J4gzx7nZkFg7utng0R0ujiqURGhfvQhSUpQE2Mis3f1EMWxjcs.	ADMIN	t	t	https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80	2026-11-23 11:16:36.248015+05:30	2026-11-23 11:16:36.248027+05:30
2	demo@cloudcart.com	demouser	Tanmay Sharma	+1 (555) 234-5678	\N	$2b$12$2hk6zHIIqr3V90.td4vPX.YelcZsIYwhmp6rSu5/inx//J3H5JcDm	CUSTOMER	t	f	https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80	2026-11-23 11:16:36.464314+05:30	2026-11-23 11:16:36.464316+05:30
3	tanmay@cloudcart.com	tanmay	Tanmay Sharma	+1 (555) 789-0123	\N	$2b$12$S6XpUA0JxWPpEg8qspKonu9wc3qpCE5DWP1MDL6RNRiYSfT6xRGES	CUSTOMER	t	f	https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80	2026-11-23 11:16:36.678242+05:30	2026-11-23 11:16:36.678245+05:30
4	seller@cloudcart.com	apextech	Apex Tech Official Store	+1 (555) 890-4321	Apex Tech Hub	$2b$12$v20uNNIgxEsSb5et8g.Q3eEcLj646uHaY4AMW3fc/6YkwZsMP9tKm	SELLER	t	f	https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80	2026-11-23 11:16:36.896278+05:30	2026-11-23 11:16:36.896283+05:30
5	testeralice@cloudcart.com	tester_alice	Alice Tester	+1-555-0199	\N	$2b$12$.byI.pqYsBCsu3mq9f9doewKTtDEWAAoI5gU.NwItxCDqhpW1Uvti	CUSTOMER	t	f	\N	2026-11-23 11:18:02.276146+05:30	2026-11-23 11:18:02.276149+05:30
6	alex.rivera@cloudcart.com	alex_rivera	Alex Rivera	+1-555-0188	\N	$2b$12$uRrwFSEk1jRIqDUiQB7HxuTWfy0BNFhS4/.6ol.MC52O6pk0cM8mK	CUSTOMER	t	f	\N	2026-11-23 11:18:03.861377+05:30	2026-11-23 11:18:03.86138+05:30
7	customer_b@cloudcart.com	customer_b	Test User	\N	\N	$2b$12$aBtDWm/B402.HhyPskrlbOBuSGZdXxTjZ9tt59JI4Vkw6QDu/rm5i	CUSTOMER	t	f	\N	2026-11-23 11:18:06.438719+05:30	2026-11-23 11:18:06.438722+05:30
8	pay_cust_a@cloudcart.com	pay_cust_a	Pay_Cust_A	\N	\N	$2b$12$6WVrSKP.2NJBGQZMy4ACg..C34zws/XV8EWYOGaxM8uEMS9AJCiBe	CUSTOMER	t	f	\N	2026-11-23 11:18:08.478816+05:30	2026-11-23 11:18:08.478819+05:30
9	pay_cust_b@cloudcart.com	pay_cust_b	Pay_Cust_B	\N	\N	$2b$12$rCld5/MXLhkCUiYUIcwRe.sqYkd.Z4vmMquCpP7MONjNxgHwLxj6K	CUSTOMER	t	f	\N	2026-11-23 11:18:08.908944+05:30	2026-11-23 11:18:08.908947+05:30
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 11, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 10, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


--
-- PostgreSQL database dump complete
--

\unrestrict CDD8RebavSTkKxUz5otpfsvJAohBMgkXshpXv7dIcYp2QGKVJtuymr7S1wCjl75

