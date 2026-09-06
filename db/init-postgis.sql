CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE IF NOT EXISTS stations (
  id bigserial PRIMARY KEY,
  station_code varchar(50) UNIQUE NOT NULL,
  station_name varchar(255) NOT NULL,
  station_type varchar(80),
  province varchar(100),
  geom geometry(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS stations_geom_gix ON stations USING GIST (geom);
CREATE INDEX IF NOT EXISTS stations_province_idx ON stations (province);
