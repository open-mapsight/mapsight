import {Fragment} from "react";
import {useSelector} from "react-redux";
import {createSelector} from "reselect";

import {
	isViewFullscreen,
	isViewMapOnly,
	isViewMobile,
	layerSwitcherConfigExternalSelector,
	layerSwitcherShowExternalSelector,
	listUiOptionDetailsSelector,
	listVisible,
	mapAndListVisible,
	mapVisible,
	pageTitleShowSelector,
	tagSwitcherShowSelector,
	timeFilterVisible,
	viewSelector,
} from "../store/selectors.ts";
import FeatureList from "./feature-list";
import {useContextComponentWithFallback} from "../helpers/components";

import VisibilityWrapper from "./helping/visibility-wrapper";

import LayerSwitcher from "./layer-switcher";
import AdditionalContainer from "./layout/additional-container";
import AdditionalContent from "./layout/additional-container/content";
import Marginal from "./layout/additional-container/marginal";
import MainContainer from "./layout/main-container";
import MapRow from "./layout/map-row";
import TitleBar from "./layout/title-bar";

// Layout
import AppWrapper from "./layout/wrapper";
import MainPanel from "./main-panel";
import MainPanelContainer from "./main-panel/container";

import {MainPanelContextProvider} from "./main-panel/context";
import MainPanelListToggleButton from "./main-panel/list-toggle-button";

// Components
import Map from "./map";
import MapOverlay from "./map-overlay";
import MapOverlayArea from "./map-overlay/area";
import Attribution from "./map-overlay/attribution";
import InfoOverlayLeft from "./map-overlay/info-overlay-left";
import InfoOverlayModal from "./map-overlay/info-overlay-modal";
import InfoOverlayRight from "./map-overlay/info-overlay-right";
import LayerSwitcherOverlay from "./map-overlay/layer-switcher-overlay";
import Legend from "./map-overlay/legend";
import Logo from "./map-overlay/logo";
import RegionSelector from "./map-overlay/region-selector";
import SearchOverlay from "./map-overlay/search-overlay";
import UserGeoLocationButton from "./map-overlay/user-geo-location-button";
import ZoomButtons from "./map-overlay/zoom-buttons";
import MapSyncedInterlay from "./map-synced-interlay";
import MapWrapper from "./map-wrapper";
import TagSwitcher from "./tag-switcher";
import TimeFilter from "./time-filter";
import DesktopViewToggleButton from "./view-toggle-button/desktop-button";
import MobileViewToggleButton from "./view-toggle-button/mobile-button";

import ViewportViewToggleButton from "./view-toggle-button/viewport-button";

const marginalLeftSelector = createSelector(
	[layerSwitcherShowExternalSelector, tagSwitcherShowSelector],
	(layerSwitcherShowExternal, tagSwitcherShow) => {
		return layerSwitcherShowExternal || tagSwitcherShow;
	},
);

/**
 * @returns {import('react').ReactElement} element
 */
function App() {
	const view = useSelector(viewSelector);
	const isMobile = isViewMobile(view);
	const isFullscreen = isViewFullscreen(view);
	const isMapOnly = isViewMapOnly(view);
	const showAdditional = !isFullscreen && !isMapOnly;
	const showDetailsInList = useSelector(listUiOptionDetailsSelector);
	const showListInMapRow =
		useSelector(listVisible) && !showDetailsInList && isFullscreen;

	const mapOverlayStart = useContextComponentWithFallback("MapOverlayStart");
	const mapOverlayTopLeft =
		useContextComponentWithFallback("MapOverlayTopLeft");
	const mapOverlayBottomLeft = useContextComponentWithFallback(
		"MapOverlayBottomLeft",
	);
	const mapOverlayTopRight =
		useContextComponentWithFallback("MapOverlayTopRight");
	const mapOverlayBottomRight = useContextComponentWithFallback(
		"MapOverlayBottomRight",
	);
	const mapOverlayEnd = useContextComponentWithFallback("MapOverlayEnd");
	const mapOverlayModal = useContextComponentWithFallback("MapOverlayModal");

	return (
		<AppWrapper>
			<MainContainer>
				<VisibilityWrapper visibleSelector={pageTitleShowSelector}>
					<TitleBar />
				</VisibilityWrapper>

				<VisibilityWrapper visibleSelector={mapVisible}>
					<MapRow>
						{!isMobile && (
							<MainPanelContextProvider
								collapsible={showListInMapRow}
								showSelectionInfo={!showDetailsInList}
								showList={showListInMapRow}
								panelPosition="left"
							>
								<MainPanelContainer>
									<MainPanelListToggleButton />
									<MainPanel />
								</MainPanelContainer>
							</MainPanelContextProvider>
						)}

						<MapWrapper>
							<Map />
							<MapSyncedInterlay />
							<MapOverlay>
								{mapOverlayStart()}

								<MapOverlayArea position="top-left">
									{mapOverlayTopLeft(
										<Fragment>
											<SearchOverlay />
											<RegionSelector />
										</Fragment>,
									)}
								</MapOverlayArea>

								<MapOverlayArea position="bottom-left">
									{mapOverlayBottomLeft(
										<Fragment>
											<InfoOverlayLeft />
										</Fragment>,
									)}
								</MapOverlayArea>

								<MapOverlayArea position="top-right">
									{mapOverlayTopRight(
										<Fragment>
											<LayerSwitcherOverlay />
											<DesktopViewToggleButton />
										</Fragment>,
									)}
								</MapOverlayArea>

								<MapOverlayArea position="bottom-right">
									{mapOverlayBottomRight(
										<Fragment>
											<ZoomButtons />
											<UserGeoLocationButton />
											<MobileViewToggleButton />
											<InfoOverlayRight />
										</Fragment>,
									)}
								</MapOverlayArea>

								{mapOverlayEnd()}

								<InfoOverlayModal>
									{mapOverlayModal(
										<Fragment>
											{isMobile && <Attribution />}
											<Legend />
											<Logo />
										</Fragment>,
									)}
								</InfoOverlayModal>
							</MapOverlay>
						</MapWrapper>
					</MapRow>
				</VisibilityWrapper>

				{isMapOnly && (
					<MainPanelContextProvider
						panelPosition="below"
						showSelectionInfo={true}
					>
						<MainPanelContainer>
							<MainPanel />
						</MainPanelContainer>
					</MainPanelContextProvider>
				)}
			</MainContainer>

			{showAdditional && (
				<AdditionalContainer>
					<VisibilityWrapper visibleSelector={marginalLeftSelector}>
						<Marginal position="left">
							<VisibilityWrapper
								visibleSelector={
									layerSwitcherConfigExternalSelector
								}
							>
								<LayerSwitcher
									configSelector={
										layerSwitcherConfigExternalSelector
									}
								/>
							</VisibilityWrapper>
							<VisibilityWrapper
								visibleSelector={tagSwitcherShowSelector}
							>
								<TagSwitcher />
							</VisibilityWrapper>
						</Marginal>
					</VisibilityWrapper>

					<AdditionalContent>
						<VisibilityWrapper visibleSelector={listVisible}>
							<FeatureList enableKeyboardControl={true} />
						</VisibilityWrapper>
					</AdditionalContent>

					<VisibilityWrapper visibleSelector={timeFilterVisible}>
						<Marginal position="right">
							<TimeFilter />
						</Marginal>
					</VisibilityWrapper>
				</AdditionalContainer>
			)}

			<VisibilityWrapper visibleSelector={mapAndListVisible}>
				<ViewportViewToggleButton />
			</VisibilityWrapper>
		</AppWrapper>
	);
}

export default App;
