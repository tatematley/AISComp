--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2
-- Dumped by pg_dump version 16.2

-- Started on 2026-01-22 23:09:01 MST

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 241 (class 1259 OID 41193)
-- Name: app_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_user (
    user_id integer NOT NULL,
    username text NOT NULL,
    user_role_id integer NOT NULL
);


ALTER TABLE public.app_user OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 41062)
-- Name: candidate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidate (
    candidate_id integer NOT NULL,
    currentrole text,
    department_id integer,
    location_id integer,
    years_exp integer,
    availability_hours integer,
    education_level_id integer,
    start_date date
);


ALTER TABLE public.candidate OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 41061)
-- Name: candidate_candidate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.candidate_candidate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidate_candidate_id_seq OWNER TO postgres;

--
-- TOC entry 3748 (class 0 OID 0)
-- Dependencies: 231
-- Name: candidate_candidate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.candidate_candidate_id_seq OWNED BY public.candidate.candidate_id;


--
-- TOC entry 233 (class 1259 OID 41085)
-- Name: candidate_information; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidate_information (
    candidate_id integer NOT NULL,
    name text NOT NULL,
    profile_photo text,
    date_of_birth date,
    age integer,
    "position" text,
    email text,
    phone_number text,
    internal boolean,
    pronouns_id integer,
    application_date date
);


ALTER TABLE public.candidate_information OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 41103)
-- Name: candidate_skill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidate_skill (
    candidate_skill_id integer NOT NULL,
    candidate_id integer,
    skill_id integer,
    proficiency_level integer
);


ALTER TABLE public.candidate_skill OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 41102)
-- Name: candidate_skill_candidate_skill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.candidate_skill_candidate_skill_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidate_skill_candidate_skill_id_seq OWNER TO postgres;

--
-- TOC entry 3749 (class 0 OID 0)
-- Dependencies: 234
-- Name: candidate_skill_candidate_skill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.candidate_skill_candidate_skill_id_seq OWNED BY public.candidate_skill.candidate_skill_id;


--
-- TOC entry 224 (class 1259 OID 41021)
-- Name: department; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department (
    department_id integer NOT NULL,
    department_name text NOT NULL
);


ALTER TABLE public.department OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 41020)
-- Name: department_department_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.department_department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.department_department_id_seq OWNER TO postgres;

--
-- TOC entry 3750 (class 0 OID 0)
-- Dependencies: 223
-- Name: department_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.department_department_id_seq OWNED BY public.department.department_id;


--
-- TOC entry 218 (class 1259 OID 40994)
-- Name: education; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.education (
    education_id integer NOT NULL,
    education_level text NOT NULL
);


ALTER TABLE public.education OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 40993)
-- Name: education_education_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.education_education_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.education_education_id_seq OWNER TO postgres;

--
-- TOC entry 3751 (class 0 OID 0)
-- Dependencies: 217
-- Name: education_education_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.education_education_id_seq OWNED BY public.education.education_id;


--
-- TOC entry 236 (class 1259 OID 41119)
-- Name: internal_candidate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.internal_candidate (
    candidate_id integer NOT NULL,
    pip boolean,
    tenure numeric(4,1),
    performance_rating integer,
    CONSTRAINT internal_candidate_performance_rating_check CHECK (((performance_rating >= 1) AND (performance_rating <= 5)))
);


ALTER TABLE public.internal_candidate OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 41131)
-- Name: job; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job (
    job_id integer NOT NULL,
    job_title text NOT NULL,
    job_category text,
    job_description text,
    department integer,
    job_status_id integer,
    min_years_experience integer,
    education_req integer,
    job_salary numeric,
    job_location integer,
    work_status text,
    start_date date
);


ALTER TABLE public.job OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 41130)
-- Name: job_job_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_job_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_job_id_seq OWNER TO postgres;

--
-- TOC entry 3752 (class 0 OID 0)
-- Dependencies: 237
-- Name: job_job_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_job_id_seq OWNED BY public.job.job_id;


--
-- TOC entry 240 (class 1259 OID 41160)
-- Name: job_skill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_skill (
    jobskill_id integer NOT NULL,
    job_id integer,
    skill_id integer,
    required_level integer,
    importance_weight numeric(4,2)
);


ALTER TABLE public.job_skill OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 41159)
-- Name: job_skill_jobskill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_skill_jobskill_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_skill_jobskill_id_seq OWNER TO postgres;

--
-- TOC entry 3753 (class 0 OID 0)
-- Dependencies: 239
-- Name: job_skill_jobskill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_skill_jobskill_id_seq OWNED BY public.job_skill.jobskill_id;


--
-- TOC entry 226 (class 1259 OID 41030)
-- Name: job_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_status (
    job_status_id integer NOT NULL,
    job_status text NOT NULL
);


ALTER TABLE public.job_status OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 41029)
-- Name: job_status_job_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_status_job_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_status_job_status_id_seq OWNER TO postgres;

--
-- TOC entry 3754 (class 0 OID 0)
-- Dependencies: 225
-- Name: job_status_job_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_status_job_status_id_seq OWNED BY public.job_status.job_status_id;


--
-- TOC entry 220 (class 1259 OID 41003)
-- Name: location; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location (
    location_id integer NOT NULL,
    location_name text NOT NULL
);


ALTER TABLE public.location OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 41002)
-- Name: location_location_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.location_location_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.location_location_id_seq OWNER TO postgres;

--
-- TOC entry 3755 (class 0 OID 0)
-- Dependencies: 219
-- Name: location_location_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.location_location_id_seq OWNED BY public.location.location_id;


--
-- TOC entry 222 (class 1259 OID 41012)
-- Name: pronoun; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pronoun (
    pronoun_id integer NOT NULL,
    pronouns text NOT NULL
);


ALTER TABLE public.pronoun OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 41011)
-- Name: pronoun_pronoun_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pronoun_pronoun_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pronoun_pronoun_id_seq OWNER TO postgres;

--
-- TOC entry 3756 (class 0 OID 0)
-- Dependencies: 221
-- Name: pronoun_pronoun_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pronoun_pronoun_id_seq OWNED BY public.pronoun.pronoun_id;


--
-- TOC entry 230 (class 1259 OID 41048)
-- Name: skill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill (
    skill_id integer NOT NULL,
    skill_name text NOT NULL,
    skill_category_id integer
);


ALTER TABLE public.skill OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 40985)
-- Name: skill_category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_category (
    skill_category_id integer NOT NULL,
    skill_category text NOT NULL
);


ALTER TABLE public.skill_category OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 40984)
-- Name: skill_category_skill_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.skill_category_skill_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skill_category_skill_category_id_seq OWNER TO postgres;

--
-- TOC entry 3757 (class 0 OID 0)
-- Dependencies: 215
-- Name: skill_category_skill_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.skill_category_skill_category_id_seq OWNED BY public.skill_category.skill_category_id;


--
-- TOC entry 229 (class 1259 OID 41047)
-- Name: skill_skill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.skill_skill_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skill_skill_id_seq OWNER TO postgres;

--
-- TOC entry 3758 (class 0 OID 0)
-- Dependencies: 229
-- Name: skill_skill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.skill_skill_id_seq OWNED BY public.skill.skill_id;


--
-- TOC entry 228 (class 1259 OID 41039)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_role_id integer NOT NULL,
    user_role text NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 41038)
-- Name: user_roles_user_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_user_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_user_role_id_seq OWNER TO postgres;

--
-- TOC entry 3759 (class 0 OID 0)
-- Dependencies: 227
-- Name: user_roles_user_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_user_role_id_seq OWNED BY public.user_roles.user_role_id;


--
-- TOC entry 3518 (class 2604 OID 41065)
-- Name: candidate candidate_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate ALTER COLUMN candidate_id SET DEFAULT nextval('public.candidate_candidate_id_seq'::regclass);


--
-- TOC entry 3519 (class 2604 OID 41106)
-- Name: candidate_skill candidate_skill_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_skill ALTER COLUMN candidate_skill_id SET DEFAULT nextval('public.candidate_skill_candidate_skill_id_seq'::regclass);


--
-- TOC entry 3514 (class 2604 OID 41024)
-- Name: department department_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department ALTER COLUMN department_id SET DEFAULT nextval('public.department_department_id_seq'::regclass);


--
-- TOC entry 3511 (class 2604 OID 40997)
-- Name: education education_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.education ALTER COLUMN education_id SET DEFAULT nextval('public.education_education_id_seq'::regclass);


--
-- TOC entry 3520 (class 2604 OID 41134)
-- Name: job job_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job ALTER COLUMN job_id SET DEFAULT nextval('public.job_job_id_seq'::regclass);


--
-- TOC entry 3521 (class 2604 OID 41163)
-- Name: job_skill jobskill_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_skill ALTER COLUMN jobskill_id SET DEFAULT nextval('public.job_skill_jobskill_id_seq'::regclass);


--
-- TOC entry 3515 (class 2604 OID 41033)
-- Name: job_status job_status_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_status ALTER COLUMN job_status_id SET DEFAULT nextval('public.job_status_job_status_id_seq'::regclass);


--
-- TOC entry 3512 (class 2604 OID 41006)
-- Name: location location_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location ALTER COLUMN location_id SET DEFAULT nextval('public.location_location_id_seq'::regclass);


--
-- TOC entry 3513 (class 2604 OID 41015)
-- Name: pronoun pronoun_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pronoun ALTER COLUMN pronoun_id SET DEFAULT nextval('public.pronoun_pronoun_id_seq'::regclass);


--
-- TOC entry 3517 (class 2604 OID 41051)
-- Name: skill skill_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill ALTER COLUMN skill_id SET DEFAULT nextval('public.skill_skill_id_seq'::regclass);


--
-- TOC entry 3510 (class 2604 OID 40988)
-- Name: skill_category skill_category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_category ALTER COLUMN skill_category_id SET DEFAULT nextval('public.skill_category_skill_category_id_seq'::regclass);


--
-- TOC entry 3516 (class 2604 OID 41042)
-- Name: user_roles user_role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN user_role_id SET DEFAULT nextval('public.user_roles_user_role_id_seq'::regclass);


--
-- TOC entry 3742 (class 0 OID 41193)
-- Dependencies: 241
-- Data for Name: app_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.app_user (user_id, username, user_role_id) FROM stdin;
1	zburnsie	2
2	sarahbboyer	1
3	tatematley	1
\.


--
-- TOC entry 3733 (class 0 OID 41062)
-- Dependencies: 232
-- Data for Name: candidate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidate (candidate_id, currentrole, department_id, location_id, years_exp, availability_hours, education_level_id, start_date) FROM stdin;
102	Marketing Analyst	2	2	4	40	3	2026-02-15
103	Data Engineer	1	1	6	40	3	2026-03-01
104	HR Operations Specialist	3	1	3	40	3	2026-02-20
105	ML Engineer	1	3	5	40	4	2026-03-15
106	Product Analyst	4	4	4	30	3	2026-02-10
107	Junior Data Analyst	1	2	1	20	2	2026-02-25
108	Security Analyst	5	1	5	40	3	2026-02-05
109	Project Manager	6	1	8	40	3	2026-01-25
110	Data Visualization Specialist	1	2	3	35	3	2026-03-10
111	Cloud Engineer	5	3	4	40	3	2026-03-20
112	Analytics Manager	1	1	7	40	4	2026-02-01
113	Talent Acquisition Coordinator	3	2	2	40	3	2026-02-18
114	Data Governance Analyst	1	1	4	40	3	2026-02-12
115	Software Engineer	7	3	5	40	3	2026-03-05
101	Business Analyst	\N	\N	3	25	\N	2026-02-01
\.


--
-- TOC entry 3734 (class 0 OID 41085)
-- Dependencies: 233
-- Data for Name: candidate_information; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidate_information (candidate_id, name, profile_photo, date_of_birth, age, "position", email, phone_number, internal, pronouns_id, application_date) FROM stdin;
102	Maya Patel	maya_patel.png	2001-09-08	24	Business Analyst	maya.patel@email.com	555-0102	f	2	2026-01-08
103	Chris Nguyen	chris_nguyen.png	1997-02-21	28	Data Engineer	chris.nguyen@email.com	555-0103	t	1	\N
104	Emily Johnson	emily_johnson.png	2000-12-03	25	HR Operations Specialist	emily.johnson@email.com	555-0104	f	2	2026-01-11
105	Sam Rivera	sam_rivera.png	1998-06-30	27	ML Engineer	sam.rivera@email.com	555-0105	f	3	2026-01-10
106	Taylor Kim	taylor_kim.png	1996-08-17	29	Product Analyst	taylor.kim@email.com	555-0106	t	2	2026-01-09
107	Alex Morgan	alex_morgan.png	2002-01-25	24	Junior Data Analyst	alex.morgan@email.com	555-0107	f	4	2026-01-12
108	Priya Shah	priya_shah.png	1995-03-11	30	Security Analyst	priya.shah@email.com	555-0108	t	2	\N
109	Ben Carter	ben_carter.png	1994-10-02	31	Project Manager	ben.carter@email.com	555-0109	t	1	\N
110	Olivia Martinez	olivia_martinez.png	1999-07-19	26	Data Visualization Specialist	olivia.martinez@email.com	555-0110	f	2	2026-01-13
111	Daniel Brooks	daniel_brooks.png	2000-05-05	25	Cloud Engineer	daniel.brooks@email.com	555-0111	f	1	2026-01-14
112	Avery Chen	avery_chen.png	1997-11-28	28	Analytics Manager	avery.chen@email.com	555-0112	t	4	\N
113	Noah Wilson	noah_wilson.png	2001-03-14	24	Talent Acquisition Coordinator	noah.wilson@email.com	555-0113	f	1	2026-01-15
114	Sofia Garcia	sofia_garcia.png	1998-01-09	28	Data Governance Analyst	sofia.garcia@email.com	555-0114	t	2	\N
115	Ethan Park	ethan_park.png	1996-09-22	29	Software Engineer	ethan.park@email.com	555-0117	f	\N	2026-01-16
101	Jordan Lee	jordan_lee.png	1999-04-12	26	Data Analyst	jordan.lee@email.com	555-0101	t	\N	\N
\.


--
-- TOC entry 3736 (class 0 OID 41103)
-- Dependencies: 235
-- Data for Name: candidate_skill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidate_skill (candidate_skill_id, candidate_id, skill_id, proficiency_level) FROM stdin;
10	102	32	4
11	102	33	4
12	102	34	3
13	102	35	3
14	102	38	2
15	102	41	2
16	102	44	5
17	102	45	4
18	102	46	4
19	102	21	3
20	103	1	4
21	103	5	4
22	103	6	4
23	103	4	3
24	103	8	4
25	103	9	3
26	103	13	3
27	103	14	4
28	103	25	3
29	103	29	2
30	104	44	5
31	104	33	3
32	104	34	4
33	104	42	4
34	104	51	4
35	104	52	3
36	104	53	3
37	104	55	3
38	104	37	3
39	104	21	2
40	105	9	5
41	105	16	5
42	105	17	4
43	105	18	4
44	105	1	3
45	105	2	4
46	105	15	3
47	105	14	4
48	105	25	3
49	105	31	3
50	105	54	3
51	106	22	4
52	106	35	4
53	106	32	4
54	106	33	4
55	106	34	4
56	106	41	3
57	106	44	4
58	106	45	3
59	106	23	4
60	106	7	2
61	107	3	4
62	107	1	3
63	107	2	2
64	107	10	3
65	107	6	2
66	107	24	2
67	107	44	3
68	107	28	3
69	107	47	3
70	108	31	4
71	108	30	4
72	108	52	4
73	108	51	4
74	108	55	3
75	108	43	3
76	108	14	3
77	108	25	2
78	108	53	3
79	108	44	3
80	109	40	5
81	109	39	4
82	109	43	4
83	109	41	4
84	109	34	4
85	109	44	4
86	109	45	3
87	109	46	4
88	109	49	3
89	109	42	4
90	110	19	5
91	110	20	4
92	110	21	4
93	110	22	4
94	110	23	5
95	110	44	4
96	110	45	4
97	110	3	3
98	110	1	3
99	110	24	3
100	111	25	4
101	111	26	3
102	111	27	3
103	111	29	3
104	111	30	3
105	111	31	4
106	111	14	4
107	111	13	3
108	111	12	3
109	111	52	3
110	112	1	4
111	112	2	4
112	112	7	4
113	112	22	4
114	112	34	4
115	112	32	4
116	112	44	4
117	112	45	4
118	112	49	3
119	112	43	3
120	112	55	3
121	113	44	5
122	113	34	4
123	113	33	3
124	113	21	3
125	113	37	3
126	113	42	3
127	113	51	3
128	113	52	3
129	113	45	3
130	114	51	5
131	114	52	5
132	114	55	4
133	114	54	4
134	114	56	4
135	114	8	3
136	114	6	3
137	114	4	3
138	114	44	3
139	114	43	3
177	115	29	3
178	115	27	2
179	115	31	3
180	115	1	3
181	115	13	4
182	115	12	4
183	115	14	4
184	115	11	3
185	115	9	4
186	115	15	3
214	101	44	4
215	101	45	3
216	101	3	4
217	101	7	3
218	101	1	4
219	101	2	3
220	101	22	3
221	101	23	3
222	101	19	2
\.


--
-- TOC entry 3725 (class 0 OID 41021)
-- Dependencies: 224
-- Data for Name: department; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department (department_id, department_name) FROM stdin;
1	Analytics
2	Marketing
3	HR
4	Product
5	IT / Security
6	Operations
7	Engineering
8	Sales
9	Finance
10	Legal
11	Support
12	Design
\.


--
-- TOC entry 3719 (class 0 OID 40994)
-- Dependencies: 218
-- Data for Name: education; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.education (education_id, education_level) FROM stdin;
1	High School Diploma
2	Associate Degree
3	Bachelor's Degree
4	Master's Degree
5	PhD
\.


--
-- TOC entry 3737 (class 0 OID 41119)
-- Dependencies: 236
-- Data for Name: internal_candidate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.internal_candidate (candidate_id, pip, tenure, performance_rating) FROM stdin;
101	f	3.2	4
103	f	5.6	5
106	f	2.1	4
108	t	1.4	3
109	f	7.8	4
112	f	6.3	5
114	f	4.0	4
\.


--
-- TOC entry 3739 (class 0 OID 41131)
-- Dependencies: 238
-- Data for Name: job; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job (job_id, job_title, job_category, job_description, department, job_status_id, min_years_experience, education_req, job_salary, job_location, work_status, start_date) FROM stdin;
202	Senior Marketing Analyst	Marketing	Own campaign measurement, customer insights, and reporting.	2	3	4	3	105000	3	Remote	2026-04-01
203	Data Analyst (BI)	Data	Create dashboards, track KPIs, and support stakeholders.	1	1	1	3	78000	2	Hybrid	2026-02-01
204	Data Engineer	Data	Build pipelines, improve data quality, and manage warehouses.	1	4	3	3	115000	1	Hybrid	2026-07-01
205	ML Engineer	Data	Deploy ML services, improve model performance, maintain CI/CD.	7	4	4	4	145000	3	Hybrid	2026-06-15
206	HR Talent Strategy Analyst	HR	Match skills to roles, create upskilling plans, and reports.	3	1	2	3	92000	1	Hybrid	2026-02-20
207	Financial Analyst	Finance	Forecast budgets, analyze variance, support leadership decisions.	9	1	2	3	88000	1	Hybrid	2026-02-25
208	Account Executive	Sales	Manage pipeline, close deals, and partner with marketing.	8	1	2	5	90000	4	Hybrid	2026-03-01
209	Sales Operations Analyst	Sales	Build reporting, improve processes, support sales planning.	8	3	2	3	82000	3	Remote	2026-04-15
210	Product Analyst	Product	Analyze user behavior and guide product roadmap decisions.	4	3	2	3	95000	4	Hybrid	2026-04-10
211	Product Manager	Product	Own roadmap, define requirements, align stakeholders.	4	4	4	3	135000	4	Hybrid	2026-06-01
212	Project Manager	Operations	Lead cross-functional projects and deliver on timeline.	6	1	3	3	105000	1	Onsite	2026-03-10
213	Scrum Master	Operations	Facilitate Agile ceremonies and improve team delivery.	6	3	2	3	98000	2	Hybrid	2026-05-01
214	UX Researcher	Product	Run interviews, synthesize insights, improve experiences.	12	4	3	3	110000	3	Remote	2026-06-20
215	UI/UX Designer	Product	Design workflows, prototypes, and UI components.	12	3	2	3	105000	3	Hybrid	2026-04-20
216	Software Engineer II	Engineering	Build features, APIs, and improve system reliability.	7	1	3	3	125000	1	Hybrid	2026-03-05
217	Backend Engineer	Engineering	Develop services and integrations; optimize performance.	7	4	4	3	140000	3	Remote	2026-07-15
218	QA Engineer	Engineering	Create test plans and automate regression testing.	7	3	2	3	95000	1	Hybrid	2026-05-10
219	Cloud Engineer	IT	Manage cloud infrastructure, CI/CD, and observability.	5	4	3	3	130000	3	Hybrid	2026-06-30
220	Security Analyst	IT	Monitor risks, manage IAM, and improve security posture.	5	1	3	3	120000	1	Onsite	2026-03-15
221	Data Governance Analyst	Data	Define data standards, privacy controls, and audits.	1	3	2	3	108000	1	Hybrid	2026-04-25
222	Compliance Specialist	Legal	Support audits and ensure policy compliance.	10	5	2	3	97000	1	Onsite	2026-12-01
223	Customer Support Lead	Support	Lead support team and improve customer experience.	11	2	3	5	72000	1	Onsite	2025-10-01
224	People Operations Coordinator	HR	Support onboarding, policies, and employee programs.	3	3	1	3	68000	1	Hybrid	2026-05-20
201	Junior Data Scientist	Data	Build predictive models and support analytics initiatives.	1	1	3	3	85000	1	Onsite	2026-02-10
\.


--
-- TOC entry 3741 (class 0 OID 41160)
-- Dependencies: 240
-- Data for Name: job_skill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_skill (jobskill_id, job_id, skill_id, required_level, importance_weight) FROM stdin;
9	202	21	4	1.00
10	202	32	4	1.10
11	202	23	4	1.00
12	202	44	5	1.20
13	202	45	4	1.00
14	202	34	4	1.00
15	202	37	3	0.80
16	202	38	2	0.60
17	203	1	3	1.00
18	203	21	3	0.90
19	203	19	3	1.00
20	203	20	2	0.80
21	203	22	3	0.90
22	203	44	4	1.00
23	203	23	3	0.90
24	204	1	4	1.20
25	204	5	4	1.20
26	204	6	3	1.00
27	204	8	3	1.00
28	204	13	3	0.90
29	204	14	3	0.80
30	204	25	2	0.70
31	204	3	3	0.80
32	205	9	4	1.20
33	205	16	4	1.20
34	205	17	3	1.00
35	205	18	3	0.90
36	205	25	3	0.90
37	205	29	3	0.80
38	205	15	3	0.80
39	205	31	3	0.80
40	206	32	3	1.00
41	206	33	4	1.10
42	206	34	4	1.10
43	206	44	5	1.20
44	206	21	3	0.80
45	206	1	3	0.70
46	206	51	3	0.80
47	206	52	3	0.90
48	206	55	3	0.70
49	206	53	2	0.60
50	207	38	4	1.20
51	207	21	3	0.80
52	207	32	3	0.90
53	207	47	3	0.90
54	207	44	3	0.80
55	207	45	3	0.70
56	207	37	3	0.70
57	208	44	5	1.20
58	208	50	3	1.00
59	208	34	4	1.00
60	208	36	3	0.80
61	208	45	3	0.80
62	208	32	2	0.60
63	208	21	2	0.50
64	209	32	3	1.00
65	209	21	3	0.90
66	209	22	3	0.80
67	209	23	3	0.80
68	209	37	3	0.80
69	209	40	2	0.70
70	209	44	3	0.70
71	210	32	4	1.10
72	210	35	3	1.00
73	210	7	3	1.00
74	210	22	3	0.90
75	210	23	4	1.00
76	210	44	4	1.00
77	210	34	3	0.90
78	211	35	4	1.10
79	211	33	4	1.00
80	211	34	4	1.00
81	211	41	4	1.00
82	211	39	3	0.80
83	211	40	3	0.90
84	211	44	5	1.20
85	211	49	3	0.80
86	212	40	4	1.20
87	212	43	3	1.00
88	212	34	4	1.00
89	212	39	3	0.90
90	212	42	4	0.90
91	212	44	4	1.00
92	212	46	4	0.90
93	212	48	3	0.80
94	213	39	4	1.10
95	213	40	3	0.90
96	213	46	4	1.00
97	213	44	4	0.90
98	213	49	3	0.80
99	213	47	3	0.80
100	213	42	3	0.70
101	214	36	4	1.00
102	214	44	4	0.90
103	214	45	3	0.80
104	214	47	3	0.80
105	214	34	3	0.80
106	214	32	2	0.60
107	214	42	3	0.60
108	215	35	3	0.90
109	215	36	3	0.80
110	215	44	4	1.00
111	215	45	4	0.90
112	215	46	3	0.80
113	215	22	3	0.80
114	215	23	3	0.70
115	216	12	3	1.00
116	216	13	3	1.00
117	216	14	3	0.80
118	216	15	3	0.90
119	216	29	2	0.70
120	216	31	2	0.60
121	216	48	3	0.70
122	216	42	3	0.60
123	217	11	4	1.00
124	217	13	4	1.00
125	217	14	3	0.80
126	217	29	3	0.90
127	217	25	3	0.80
128	217	27	2	0.60
129	217	15	3	0.80
130	217	48	3	0.70
131	218	15	4	1.20
132	218	14	3	0.80
133	218	42	4	0.90
134	218	48	3	0.80
135	218	44	3	0.60
136	218	13	2	0.60
137	218	29	2	0.60
138	219	25	4	1.10
139	219	27	3	0.80
140	219	29	4	1.00
141	219	30	3	0.90
142	219	31	4	1.10
143	219	28	2	0.70
144	219	14	3	0.70
145	219	48	3	0.60
146	220	31	4	1.20
147	220	30	4	1.00
148	220	52	3	0.90
149	220	55	3	0.90
150	220	43	3	0.80
151	220	14	3	0.70
152	220	48	3	0.70
153	220	44	3	0.60
154	221	51	4	1.10
155	221	52	4	1.20
156	221	55	4	1.00
157	221	54	3	0.90
158	221	8	3	0.80
159	221	6	2	0.70
160	221	37	3	0.70
161	221	44	3	0.60
162	222	51	4	1.20
163	222	43	4	1.00
164	222	55	3	0.90
165	222	52	3	0.90
166	222	42	4	0.80
167	222	44	4	0.80
168	222	34	3	0.70
169	223	44	5	1.20
170	223	46	4	0.90
171	223	49	3	0.80
172	223	48	3	0.80
173	223	36	3	0.70
174	223	42	3	0.70
175	223	47	3	0.70
176	224	44	4	1.00
177	224	42	3	0.80
178	224	34	3	0.80
179	224	33	3	0.70
180	224	37	3	0.70
181	224	51	3	0.70
182	224	52	2	0.60
183	224	46	3	0.70
208	201	44	3	0.70
209	201	23	2	0.60
210	201	21	3	0.70
211	201	7	2	0.80
212	201	16	2	1.10
213	201	9	3	1.20
214	201	1	3	1.00
215	201	2	3	1.00
\.


--
-- TOC entry 3727 (class 0 OID 41030)
-- Dependencies: 226
-- Data for Name: job_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_status (job_status_id, job_status) FROM stdin;
1	Now Hiring
2	Position Filled
3	Hiring Within 3 Months
4	Hiring Within 6 Months
5	Hiring Within 12 Months
\.


--
-- TOC entry 3721 (class 0 OID 41003)
-- Dependencies: 220
-- Data for Name: location; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.location (location_id, location_name) FROM stdin;
1	HQ - Provo, UT
2	Salt Lake City, UT
3	Remote
4	Denver, CO
\.


--
-- TOC entry 3723 (class 0 OID 41012)
-- Dependencies: 222
-- Data for Name: pronoun; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pronoun (pronoun_id, pronouns) FROM stdin;
1	he/him
2	she/her
3	they/them
4	he/they
5	she/they
6	prefer not to say
\.


--
-- TOC entry 3731 (class 0 OID 41048)
-- Dependencies: 230
-- Data for Name: skill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skill (skill_id, skill_name, skill_category_id) FROM stdin;
1	SQL	1
2	Statistics	1
3	Data Cleaning	1
4	Data Modeling	1
5	ETL / Data Pipelines	1
6	Data Warehousing	1
7	Experiment Design / A-B Testing	1
8	Data Quality / Validation	1
9	Python	2
10	R	2
11	Java	2
12	C# / .NET	2
13	API Integration	2
14	Git / Version Control	2
15	Unit Testing	2
16	Machine Learning	2
17	Natural Language Processing (NLP)	2
18	Prompt Engineering	2
19	Tableau	3
20	Power BI	3
21	Excel	3
22	Dashboard Design	3
23	Data Storytelling	3
24	Matplotlib / Plotting	3
25	AWS	4
26	Azure	4
27	Docker	4
28	Kubernetes	4
29	CI/CD	4
30	Identity & Access Management (IAM)	4
31	Security Fundamentals	4
32	Business Analysis	5
33	Requirements Gathering	5
34	Stakeholder Management	5
35	Product Thinking	5
36	Customer Empathy	5
37	Process Improvement	5
38	Financial Acumen	5
39	Agile / Scrum	6
40	Project Management	6
41	Roadmapping	6
42	Documentation	6
43	Risk Management	6
44	Communication	7
45	Presentation Skills	7
46	Collaboration	7
47	Critical Thinking	7
48	Problem Solving	7
49	Leadership	7
50	Negotiation	7
51	Ethics & Compliance	8
52	Data Privacy	8
53	Bias & Fairness Awareness	8
54	Explainability / Model Transparency	8
55	Audit Logging & Traceability	8
56	Responsible AI Practices	8
\.


--
-- TOC entry 3717 (class 0 OID 40985)
-- Dependencies: 216
-- Data for Name: skill_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skill_category (skill_category_id, skill_category) FROM stdin;
1	Data & Analytics
2	Programming & Engineering
3	Visualization & BI
4	Cloud & DevOps
5	Product & Business
6	Project & Process
7	Communication & Collaboration
8	Governance, Risk & Ethics
\.


--
-- TOC entry 3729 (class 0 OID 41039)
-- Dependencies: 228
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (user_role_id, user_role) FROM stdin;
1	HR Employee
2	HR Manager
\.


--
-- TOC entry 3760 (class 0 OID 0)
-- Dependencies: 231
-- Name: candidate_candidate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidate_candidate_id_seq', 2, true);


--
-- TOC entry 3761 (class 0 OID 0)
-- Dependencies: 234
-- Name: candidate_skill_candidate_skill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidate_skill_candidate_skill_id_seq', 224, true);


--
-- TOC entry 3762 (class 0 OID 0)
-- Dependencies: 223
-- Name: department_department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.department_department_id_seq', 1, false);


--
-- TOC entry 3763 (class 0 OID 0)
-- Dependencies: 217
-- Name: education_education_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.education_education_id_seq', 1, false);


--
-- TOC entry 3764 (class 0 OID 0)
-- Dependencies: 237
-- Name: job_job_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_job_id_seq', 1, true);


--
-- TOC entry 3765 (class 0 OID 0)
-- Dependencies: 239
-- Name: job_skill_jobskill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_skill_jobskill_id_seq', 215, true);


--
-- TOC entry 3766 (class 0 OID 0)
-- Dependencies: 225
-- Name: job_status_job_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_status_job_status_id_seq', 1, false);


--
-- TOC entry 3767 (class 0 OID 0)
-- Dependencies: 219
-- Name: location_location_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.location_location_id_seq', 1, false);


--
-- TOC entry 3768 (class 0 OID 0)
-- Dependencies: 221
-- Name: pronoun_pronoun_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pronoun_pronoun_id_seq', 1, false);


--
-- TOC entry 3769 (class 0 OID 0)
-- Dependencies: 215
-- Name: skill_category_skill_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skill_category_skill_category_id_seq', 1, false);


--
-- TOC entry 3770 (class 0 OID 0)
-- Dependencies: 229
-- Name: skill_skill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skill_skill_id_seq', 1, false);


--
-- TOC entry 3771 (class 0 OID 0)
-- Dependencies: 227
-- Name: user_roles_user_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_roles_user_role_id_seq', 1, false);


--
-- TOC entry 3554 (class 2606 OID 41199)
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3556 (class 2606 OID 41201)
-- Name: app_user app_user_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_username_key UNIQUE (username);


--
-- TOC entry 3542 (class 2606 OID 41091)
-- Name: candidate_information candidate_information_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_information
    ADD CONSTRAINT candidate_information_pkey PRIMARY KEY (candidate_id);


--
-- TOC entry 3540 (class 2606 OID 41069)
-- Name: candidate candidate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate
    ADD CONSTRAINT candidate_pkey PRIMARY KEY (candidate_id);


--
-- TOC entry 3544 (class 2606 OID 41108)
-- Name: candidate_skill candidate_skill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_skill
    ADD CONSTRAINT candidate_skill_pkey PRIMARY KEY (candidate_skill_id);


--
-- TOC entry 3546 (class 2606 OID 41208)
-- Name: candidate_skill candidate_skill_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_skill
    ADD CONSTRAINT candidate_skill_unique UNIQUE (candidate_id, skill_id);


--
-- TOC entry 3532 (class 2606 OID 41028)
-- Name: department department_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_pkey PRIMARY KEY (department_id);


--
-- TOC entry 3526 (class 2606 OID 41001)
-- Name: education education_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.education
    ADD CONSTRAINT education_pkey PRIMARY KEY (education_id);


--
-- TOC entry 3548 (class 2606 OID 41124)
-- Name: internal_candidate internal_candidate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internal_candidate
    ADD CONSTRAINT internal_candidate_pkey PRIMARY KEY (candidate_id);


--
-- TOC entry 3550 (class 2606 OID 41138)
-- Name: job job_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job
    ADD CONSTRAINT job_pkey PRIMARY KEY (job_id);


--
-- TOC entry 3552 (class 2606 OID 41165)
-- Name: job_skill job_skill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_skill
    ADD CONSTRAINT job_skill_pkey PRIMARY KEY (jobskill_id);


--
-- TOC entry 3534 (class 2606 OID 41037)
-- Name: job_status job_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_status
    ADD CONSTRAINT job_status_pkey PRIMARY KEY (job_status_id);


--
-- TOC entry 3528 (class 2606 OID 41010)
-- Name: location location_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_pkey PRIMARY KEY (location_id);


--
-- TOC entry 3530 (class 2606 OID 41019)
-- Name: pronoun pronoun_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pronoun
    ADD CONSTRAINT pronoun_pkey PRIMARY KEY (pronoun_id);


--
-- TOC entry 3524 (class 2606 OID 40992)
-- Name: skill_category skill_category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_category
    ADD CONSTRAINT skill_category_pkey PRIMARY KEY (skill_category_id);


--
-- TOC entry 3538 (class 2606 OID 41055)
-- Name: skill skill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill
    ADD CONSTRAINT skill_pkey PRIMARY KEY (skill_id);


--
-- TOC entry 3536 (class 2606 OID 41046)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_role_id);


--
-- TOC entry 3572 (class 2606 OID 41202)
-- Name: app_user app_user_user_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_user_role_id_fkey FOREIGN KEY (user_role_id) REFERENCES public.user_roles(user_role_id);


--
-- TOC entry 3558 (class 2606 OID 41070)
-- Name: candidate candidate_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate
    ADD CONSTRAINT candidate_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.department(department_id);


--
-- TOC entry 3559 (class 2606 OID 41080)
-- Name: candidate candidate_education_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate
    ADD CONSTRAINT candidate_education_level_id_fkey FOREIGN KEY (education_level_id) REFERENCES public.education(education_id);


--
-- TOC entry 3561 (class 2606 OID 41092)
-- Name: candidate_information candidate_information_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_information
    ADD CONSTRAINT candidate_information_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidate(candidate_id);


--
-- TOC entry 3562 (class 2606 OID 41097)
-- Name: candidate_information candidate_information_pronouns_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_information
    ADD CONSTRAINT candidate_information_pronouns_id_fkey FOREIGN KEY (pronouns_id) REFERENCES public.pronoun(pronoun_id);


--
-- TOC entry 3560 (class 2606 OID 41075)
-- Name: candidate candidate_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate
    ADD CONSTRAINT candidate_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(location_id);


--
-- TOC entry 3563 (class 2606 OID 41109)
-- Name: candidate_skill candidate_skill_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_skill
    ADD CONSTRAINT candidate_skill_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidate(candidate_id);


--
-- TOC entry 3564 (class 2606 OID 41114)
-- Name: candidate_skill candidate_skill_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_skill
    ADD CONSTRAINT candidate_skill_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill(skill_id);


--
-- TOC entry 3565 (class 2606 OID 41125)
-- Name: internal_candidate internal_candidate_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internal_candidate
    ADD CONSTRAINT internal_candidate_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidate(candidate_id);


--
-- TOC entry 3566 (class 2606 OID 41139)
-- Name: job job_department_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job
    ADD CONSTRAINT job_department_fkey FOREIGN KEY (department) REFERENCES public.department(department_id);


--
-- TOC entry 3567 (class 2606 OID 41149)
-- Name: job job_education_req_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job
    ADD CONSTRAINT job_education_req_fkey FOREIGN KEY (education_req) REFERENCES public.education(education_id);


--
-- TOC entry 3568 (class 2606 OID 41154)
-- Name: job job_job_location_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job
    ADD CONSTRAINT job_job_location_fkey FOREIGN KEY (job_location) REFERENCES public.location(location_id);


--
-- TOC entry 3569 (class 2606 OID 41144)
-- Name: job job_job_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job
    ADD CONSTRAINT job_job_status_id_fkey FOREIGN KEY (job_status_id) REFERENCES public.job_status(job_status_id);


--
-- TOC entry 3570 (class 2606 OID 41166)
-- Name: job_skill job_skill_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_skill
    ADD CONSTRAINT job_skill_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job(job_id);


--
-- TOC entry 3571 (class 2606 OID 41171)
-- Name: job_skill job_skill_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_skill
    ADD CONSTRAINT job_skill_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill(skill_id);


--
-- TOC entry 3557 (class 2606 OID 41056)
-- Name: skill skill_skill_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill
    ADD CONSTRAINT skill_skill_category_id_fkey FOREIGN KEY (skill_category_id) REFERENCES public.skill_category(skill_category_id);


-- Completed on 2026-01-22 23:09:01 MST

--
-- PostgreSQL database dump complete
--

