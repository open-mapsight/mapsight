/**
 * Small hand-written capabilities documents with invented layers and
 * `example.org` URLs. They only contain what the helpers read.
 */

export const WMS_130 = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
	<Service>
		<Name>WMS</Name>
		<Title>Example map service</Title>
		<OnlineResource xlink:href="https://wms.example.org/"/>
	</Service>
	<Capability>
		<Request>
			<GetCapabilities>
				<Format>text/xml</Format>
				<DCPType><HTTP><Get><OnlineResource xlink:href="https://wms.example.org/caps?"/></Get></HTTP></DCPType>
			</GetCapabilities>
			<GetMap>
				<Format>image/jpeg</Format>
				<Format>image/png; mode=8bit</Format>
				<Format>image/png</Format>
				<DCPType><HTTP><Get><OnlineResource xlink:href="https://wms.example.org/maps?"/></Get></HTTP></DCPType>
			</GetMap>
		</Request>
		<Layer queryable="1">
			<Title>Example root</Title>
			<CRS>EPSG:3857</CRS>
			<CRS>EPSG:4326</CRS>
			<EX_GeographicBoundingBox>
				<westBoundLongitude>5</westBoundLongitude>
				<eastBoundLongitude>15</eastBoundLongitude>
				<southBoundLatitude>47</southBoundLatitude>
				<northBoundLatitude>55</northBoundLatitude>
			</EX_GeographicBoundingBox>
			<BoundingBox CRS="EPSG:3857" minx="556597" miny="5942074" maxx="1669792" maxy="7361866"/>
			<Attribution><Title>Example Org</Title></Attribution>
			<Layer>
				<Name>boundaries</Name>
				<Title>Boundaries</Title>
				<Abstract>Administrative boundaries.</Abstract>
				<CRS>EPSG:25832</CRS>
				<EX_GeographicBoundingBox>
					<westBoundLongitude>6</westBoundLongitude>
					<eastBoundLongitude>10</eastBoundLongitude>
					<southBoundLatitude>50</southBoundLatitude>
					<northBoundLatitude>52</northBoundLatitude>
				</EX_GeographicBoundingBox>
				<Style><Name>outline</Name><Title>Outline</Title></Style>
				<Style><Name>filled</Name><Title>Filled</Title></Style>
				<Layer>
					<Name>districts</Name>
					<Title>Districts</Title>
					<Style><Name>labelled</Name><Title>Labelled</Title></Style>
				</Layer>
				<Layer queryable="0">
					<Name>parcels</Name>
					<Title>Parcels</Title>
					<CRS>EPSG:2056</CRS>
				</Layer>
			</Layer>
			<Layer>
				<Title>Unnamed folder</Title>
				<Layer>
					<Name>rivers</Name>
					<Title>Rivers</Title>
					<Abstract>Rivers and streams.</Abstract>
				</Layer>
			</Layer>
		</Layer>
	</Capability>
</WMS_Capabilities>`;

export const WMS_111 = `<?xml version="1.0" encoding="UTF-8"?>
<WMT_MS_Capabilities version="1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink">
	<Service>
		<Name>OGC:WMS</Name>
		<Title>Legacy example service</Title>
		<OnlineResource xlink:href="https://legacy.example.org/"/>
	</Service>
	<Capability>
		<Request>
			<GetMap>
				<Format>image/gif</Format>
				<Format>image/png</Format>
				<DCPType><HTTP><Get><OnlineResource xlink:href="https://legacy.example.org/wms?map=demo&amp;"/></Get></HTTP></DCPType>
			</GetMap>
		</Request>
		<Layer queryable="1">
			<Title>Legacy root</Title>
			<SRS>EPSG:4326 EPSG:3857</SRS>
			<LatLonBoundingBox minx="5" miny="47" maxx="15" maxy="55"/>
			<Layer>
				<Name>lakes</Name>
				<Title>Lakes</Title>
			</Layer>
			<Layer queryable="0">
				<Name>forests</Name>
				<Title>Forests</Title>
				<SRS>EPSG:25832</SRS>
				<LatLonBoundingBox minx="8" miny="49" maxx="9" maxy="50"/>
			</Layer>
		</Layer>
	</Capability>
</WMT_MS_Capabilities>`;

const MATRIX_SET_WEBMERCATOR = `
		<TileMatrixSet>
			<ows:Identifier>webmercator</ows:Identifier>
			<ows:SupportedCRS>urn:ogc:def:crs:EPSG::3857</ows:SupportedCRS>
			<TileMatrix>
				<ows:Identifier>0</ows:Identifier>
				<ScaleDenominator>559082264.0287178</ScaleDenominator>
				<TopLeftCorner>-20037508.342789244 20037508.342789244</TopLeftCorner>
				<TileWidth>256</TileWidth><TileHeight>256</TileHeight>
				<MatrixWidth>1</MatrixWidth><MatrixHeight>1</MatrixHeight>
			</TileMatrix>
			<TileMatrix>
				<ows:Identifier>1</ows:Identifier>
				<ScaleDenominator>279541132.0143589</ScaleDenominator>
				<TopLeftCorner>-20037508.342789244 20037508.342789244</TopLeftCorner>
				<TileWidth>256</TileWidth><TileHeight>256</TileHeight>
				<MatrixWidth>2</MatrixWidth><MatrixHeight>2</MatrixHeight>
			</TileMatrix>
			<TileMatrix>
				<ows:Identifier>2</ows:Identifier>
				<ScaleDenominator>139770566.00717944</ScaleDenominator>
				<TopLeftCorner>-20037508.342789244 20037508.342789244</TopLeftCorner>
				<TileWidth>256</TileWidth><TileHeight>256</TileHeight>
				<MatrixWidth>4</MatrixWidth><MatrixHeight>4</MatrixHeight>
			</TileMatrix>
		</TileMatrixSet>`;

const MATRIX_SET_GEOGRAPHIC = `
		<TileMatrixSet>
			<ows:Identifier>geographic</ows:Identifier>
			<ows:SupportedCRS>urn:ogc:def:crs:EPSG::4326</ows:SupportedCRS>
			<TileMatrix>
				<ows:Identifier>geographic:0</ows:Identifier>
				<ScaleDenominator>279541132.0143589</ScaleDenominator>
				<TopLeftCorner>90 -180</TopLeftCorner>
				<TileWidth>256</TileWidth><TileHeight>256</TileHeight>
				<MatrixWidth>2</MatrixWidth><MatrixHeight>1</MatrixHeight>
			</TileMatrix>
			<TileMatrix>
				<ows:Identifier>geographic:1</ows:Identifier>
				<ScaleDenominator>139770566.00717944</ScaleDenominator>
				<TopLeftCorner>90 -180</TopLeftCorner>
				<TileWidth>256</TileWidth><TileHeight>256</TileHeight>
				<MatrixWidth>4</MatrixWidth><MatrixHeight>2</MatrixHeight>
			</TileMatrix>
		</TileMatrixSet>`;

function wmtsDocument({
	getTile,
	layers,
	matrixSets,
}: {
	getTile: string;
	layers: string;
	matrixSets: string;
}) {
	return `<?xml version="1.0" encoding="UTF-8"?>
<Capabilities version="1.0.0" xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink">
	<ows:ServiceIdentification>
		<ows:Title>Example tile service</ows:Title>
		<ows:ServiceType>OGC WMTS</ows:ServiceType>
		<ows:ServiceTypeVersion>1.0.0</ows:ServiceTypeVersion>
	</ows:ServiceIdentification>${getTile}
	<Contents>${layers}${matrixSets}
	</Contents>
</Capabilities>`;
}

/**
 * KVP service (advertised `GetEncoding` constraint) whose `basemap` layer also
 * offers a REST resource URL, plus a layer that only exists in the
 * `geographic` matrix set.
 */
export const WMTS_KVP = wmtsDocument({
	getTile: `
	<ows:OperationsMetadata>
		<ows:Operation name="GetTile">
			<ows:DCP><ows:HTTP>
				<ows:Get xlink:href="https://tiles.example.org/wmts?">
					<ows:Constraint name="GetEncoding"><ows:AllowedValues><ows:Value>KVP</ows:Value></ows:AllowedValues></ows:Constraint>
				</ows:Get>
			</ows:HTTP></ows:DCP>
		</ows:Operation>
	</ows:OperationsMetadata>`,
	layers: `
		<Layer>
			<ows:Title>Base map</ows:Title>
			<ows:Abstract>A basemap.</ows:Abstract>
			<ows:WGS84BoundingBox>
				<ows:LowerCorner>5 47</ows:LowerCorner>
				<ows:UpperCorner>15 55</ows:UpperCorner>
			</ows:WGS84BoundingBox>
			<ows:Identifier>basemap</ows:Identifier>
			<Style><ows:Identifier>plain</ows:Identifier></Style>
			<Style isDefault="true"><ows:Identifier>default</ows:Identifier></Style>
			<Format>image/jpeg</Format>
			<Format>image/png</Format>
			<InfoFormat>text/plain</InfoFormat>
			<TileMatrixSetLink><TileMatrixSet>geographic</TileMatrixSet></TileMatrixSetLink>
			<TileMatrixSetLink><TileMatrixSet>webmercator</TileMatrixSet></TileMatrixSetLink>
			<ResourceURL format="image/png" resourceType="tile" template="https://tiles.example.org/rest/basemap/{style}/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png"/>
		</Layer>
		<Layer>
			<ows:Title>Polar overview</ows:Title>
			<ows:Identifier>overview</ows:Identifier>
			<Style isDefault="true"><ows:Identifier>default</ows:Identifier></Style>
			<Format>image/png</Format>
			<TileMatrixSetLink>
				<TileMatrixSet>geographic</TileMatrixSet>
				<TileMatrixSetLimits>
					<TileMatrixLimits><TileMatrix>geographic:0</TileMatrix><MinTileRow>0</MinTileRow><MaxTileRow>0</MaxTileRow><MinTileCol>1</MinTileCol><MaxTileCol>1</MaxTileCol></TileMatrixLimits>
					<TileMatrixLimits><TileMatrix>geographic:1</TileMatrix><MinTileRow>0</MinTileRow><MaxTileRow>1</MaxTileRow><MinTileCol>2</MinTileCol><MaxTileCol>3</MaxTileCol></TileMatrixLimits>
				</TileMatrixSetLimits>
			</TileMatrixSetLink>
		</Layer>`,
	matrixSets: MATRIX_SET_GEOGRAPHIC + MATRIX_SET_WEBMERCATOR,
});

/** REST-only service: no GetTile operation, resource URL templates only. */
export const WMTS_REST = wmtsDocument({
	getTile: "",
	layers: `
		<Layer>
			<ows:Title>Aerial</ows:Title>
			<ows:Identifier>aerial</ows:Identifier>
			<Style isDefault="true"><ows:Identifier>default</ows:Identifier></Style>
			<Format>image/jpeg</Format>
			<TileMatrixSetLink><TileMatrixSet>webmercator</TileMatrixSet></TileMatrixSetLink>
			<Dimension>
				<ows:Identifier>time</ows:Identifier>
				<Default>2020</Default>
				<Value>2019</Value>
				<Value>2020</Value>
			</Dimension>
			<ResourceURL format="image/jpeg" resourceType="tile" template="https://tiles.example.org/rest/aerial/{time}/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.jpg"/>
		</Layer>`,
	matrixSets: MATRIX_SET_WEBMERCATOR,
});
