--
-- PostgreSQL database dump
--

\restrict 3V88KSRuPWTc2HHyQfgEcD32Vh3p3Ezsc3TT7s5HgG6mfcZ9tSaviGs3Cf1lOcj

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-06-19 18:02:15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- TOC entry 220 (class 1259 OID 16787)
-- Name: songs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.songs (
    id integer NOT NULL,
    track_id text,
    artists text NOT NULL,
    album_name text,
    track_name text NOT NULL,
    popularity smallint,
    duration_ms integer NOT NULL,
    explicit boolean,
    danceability numeric(4,3),
    energy numeric(4,3),
    key smallint,
    loudness numeric(6,3),
    mode smallint,
    speechiness numeric(5,4),
    acousticness numeric(5,4),
    instrumentalness numeric(8,7),
    liveness numeric(5,4),
    valence numeric(5,4),
    tempo numeric(6,2),
    time_signature smallint,
    track_genre text,
    CONSTRAINT songs_acousticness_check CHECK (((acousticness >= (0)::numeric) AND (acousticness <= (1)::numeric))),
    CONSTRAINT songs_danceability_check CHECK (((danceability >= (0)::numeric) AND (danceability <= (1)::numeric))),
    CONSTRAINT songs_energy_check CHECK (((energy >= (0)::numeric) AND (energy <= (1)::numeric))),
    CONSTRAINT songs_instrumentalness_check CHECK (((instrumentalness >= (0)::numeric) AND (instrumentalness <= (1)::numeric))),
    CONSTRAINT songs_key_check CHECK (((key >= 0) AND (key <= 11))),
    CONSTRAINT songs_liveness_check CHECK (((liveness >= (0)::numeric) AND (liveness <= (1)::numeric))),
    CONSTRAINT songs_mode_check CHECK ((mode = ANY (ARRAY[0, 1]))),
    CONSTRAINT songs_popularity_check CHECK (((popularity >= 0) AND (popularity <= 100))),
    CONSTRAINT songs_speechiness_check CHECK (((speechiness >= (0)::numeric) AND (speechiness <= (1)::numeric))),
    CONSTRAINT songs_valence_check CHECK (((valence >= (0)::numeric) AND (valence <= (1)::numeric)))
);


ALTER TABLE public.songs OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16786)
-- Name: songs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.songs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.songs_id_seq OWNER TO postgres;

--
-- TOC entry 5021 (class 0 OID 0)
-- Dependencies: 219
-- Name: songs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.songs_id_seq OWNED BY public.songs.id;


--
-- TOC entry 4856 (class 2604 OID 16790)
-- Name: songs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.songs ALTER COLUMN id SET DEFAULT nextval('public.songs_id_seq'::regclass);


--
-- TOC entry 4868 (class 2606 OID 16808)
-- Name: songs songs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_pkey PRIMARY KEY (id);


-- Completed on 2026-06-19 18:02:16

--
-- PostgreSQL database dump complete
--

\unrestrict 3V88KSRuPWTc2HHyQfgEcD32Vh3p3Ezsc3TT7s5HgG6mfcZ9tSaviGs3Cf1lOcj

