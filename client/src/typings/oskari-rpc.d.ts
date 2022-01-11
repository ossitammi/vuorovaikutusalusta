/**
 * Partial type declarations for the oskari-rpc library.
 */
declare module 'oskari-rpc' {
  /**
   * Draw tools related requests
   */
  namespace DrawTools {
    /**
     * Start drawing request
     */
    export type StartDrawingRequest = (
      name: 'DrawTools.StartDrawingRequest',
      params: [
        id: string,
        shape: 'Point' | 'Circle' | 'Polygon' | 'Box' | 'Square' | 'LineString',
        options: {
          buffer?: number;
          style?: object;
          allowMultipleDrawing?: boolean | 'single' | 'multiGeom';
          drawControl?: boolean;
          modifyControl?: boolean;
          showMeasureOnMap?: boolean;
          selfIntersection?: boolean;
          geojson?: string;
        }
      ]
    ) => void;

    /**
     * Stop drawing request
     */
    export type StopDrawingRequest = (
      name: 'DrawTools.StopDrawingRequest',
      params: [id: string, clearCurrent?: boolean, supressEvent?: boolean]
    ) => void;
  }

  /**
   * MapModulePlugin related requests
   */
  namespace MapModulePlugin {
    /**
     * Map layer visibility request
     */
    export type MapLayerVisibilityRequest = (
      name: 'MapModulePlugin.MapLayerVisibilityRequest',
      params: [layerId: number, visibility: boolean]
    ) => void;
    /**
     * Add features to map request
     */
    export type AddFeaturesToMapRequest = (
      name: 'MapModulePlugin.AddFeaturesToMapRequest',
      params: [
        geoJson: GeoJSON.FeatureCollection,
        options: {
          layerId: string;
          clearPrevious: boolean;
          centerTo: boolean;
          featureStyle?: {
            stroke?: {
              color: string;
              width: number;
            };
            fill?: {
              color: string;
            };
          };
        }
      ]
    ) => void;

    /**
     * Zoom to provided features request
     */
    export type ZoomToFeaturesRequest = (
      name: 'MapModulePlugin.ZoomToFeaturesRequest',
      params: [
        options: {
          layer?: string[];
          maxZoomLevel?: number;
        },
        featureFilter: {
          [key: string]: string[];
        }
      ]
    ) => void;

    /**
     * Remove features from map request
     */
    export type RemoveFeaturesFromMapRequest = (
      name: 'MapModulePlugin.RemoveFeaturesFromMapRequest',
      params: [
        featureFilterKey: string,
        featureFilterValue: string | number,
        layerId: string
      ]
    ) => void;
  }

  /**
   * InfoBox related requests
   */
  export namespace InfoBox {
    export interface ContentItem {
      html?: string;
      actions?: {
        name: string;
        type: 'link' | 'button';
        action: {
          [key: string]: string | number;
        };
      }[];
    }

    /**
     * Show InfoBox with given parameters
     */
    export type ShowInfoBoxRequest = (
      name: 'InfoBox.ShowInfoBoxRequest',
      params: [
        id: string,
        title: string,
        content: ContentItem[],
        position:
          | {
              lat: number;
              lon: number;
            }
          | {
              marker: string;
            },
        options: {
          hidePrevious?: boolean;
        }
      ]
    ) => void;

    /**
     * Hide InfoBox with given ID
     */
    export type HideInfoBoxRequest = (
      name: 'InfoBox.HideInfoBoxRequest',
      params: [id: string]
    ) => void;
  }

  /**
   * All Oskari events
   */
  namespace Event {
    /**
     * Oskari drawing event
     */
    export type DrawingEvent = (
      name: 'DrawingEvent',
      callback: (payload: {
        geojson: GeoJSON.FeatureCollection<
          GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon
        > & {
          crs: string;
        };
        id: string;
        isFinished: boolean;
      }) => void
    ) => void;

    /**
     * Oskari feature event
     */
    export type FeatureEvent = (
      name: 'FeatureEvent',
      callback: (payload: {
        operation: 'add' | 'remove' | 'click' | 'zoom' | 'error';
        features: {
          layerId: string;
          geojson: any;
        }[];
      }) => void
    ) => void;

    /**
     * Oskari infobox action event
     */
    export type InfoboxActionEvent = (
      name: 'InfoboxActionEvent',
      callback: (payload: {
        /**
         * Layer ID
         */
        id: string;
        /**
         * Action parameters
         */
        actionParams: any;
      }) => void
    ) => void;
  }

  export interface Channel {
    onReady: (callback: (info: ChannelInfo) => void) => void;
    log: (text: string) => void;
    getAllLayers: (callback: (layers: Layer[]) => void) => void;
    getSupportedEvents: (callback: (events: unknown[]) => void) => void;
    getSupportedRequests: (callback: (requests: unknown[]) => void) => void;
    getSupportedFunctions: (callback: (functions: unknown[]) => void) => void;
    /**
     * Post an Oskari request
     */
    postRequest: MapModulePlugin.MapLayerVisibilityRequest &
      DrawTools.StartDrawingRequest &
      DrawTools.StopDrawingRequest &
      MapModulePlugin.AddFeaturesToMapRequest &
      MapModulePlugin.ZoomToFeaturesRequest &
      MapModulePlugin.RemoveFeaturesFromMapRequest &
      InfoBox.ShowInfoBoxRequest &
      InfoBox.HideInfoBoxRequest;
    /**
     * Handle an Oskari event
     */
    handleEvent: Event.DrawingEvent &
      Event.FeatureEvent &
      Event.InfoboxActionEvent;
    /**
     * Unregister any registered event handler
     */
    unregisterEventHandler: (
      name: string,
      handler: (...args: any) => void
    ) => void;
  }

  export interface ChannelInfo {
    /**
     *
     * Is the RPC client supported?
     */
    clientSupported: boolean;
    /**
     * Oskari version
     */
    version: string;
  }

  export interface Layer {
    /**
     * ID of the map layer
     */
    id: number;
    /**
     * Name of the map layer
     */
    name: string;
  }

  export interface Synchronizer {
    synchronize: (state: unknown) => void;
    destroy: () => void;
  }

  export interface Handler {
    init: (channel: Channel) => void;
    synchronize: (channel: Channel, state: unknown) => void;
    destroy: () => void;
  }

  const OskariRPC: {
    connect: (
      iframeElement: HTMLIFrameElement,
      iframeDomain: string
    ) => Channel;
    synchronizerFactory: (
      channel: Channel,
      handlers: Handler[]
    ) => Synchronizer;
    VERSION: string;
  };
  export default OskariRPC;
}
