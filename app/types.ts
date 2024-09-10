export interface ProcessingConfig {
  resize: boolean;
  removeBackground: boolean;
  changeBgToLightGray: boolean;
  fitHead: boolean;
  fixHeadTilt: boolean;
  adjustContrast: boolean;
  photoRoomApiKey?: string;
}