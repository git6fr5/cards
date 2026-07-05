import { METAL_THEMES, TEXT_EMBOSS_FILTER_ID } from './metalThemes';
import { LIGHT_AZIMUTH, LIGHT_ELEVATION } from './lightSource';

export default function PieceFilterDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {Object.values(METAL_THEMES).map((theme) => (
          <filter
            key={theme.filterId}
            id={theme.filterId}
            x="-20%"
            y="-20%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.2" result="blur" />
            <feDiffuseLighting
              in="blur"
              surfaceScale="5"
              diffuseConstant="0.2"
              lightingColor="#fff"
              result="diffuse"
            >
              <feDistantLight azimuth={LIGHT_AZIMUTH} elevation={LIGHT_ELEVATION} />
            </feDiffuseLighting>
            <feSpecularLighting
              in="blur"
              surfaceScale="-2.2"
              specularConstant="0.3"
              specularExponent="0.4"
              lightingColor="#0000ff"
              result="specular"
            >
              <feDistantLight azimuth={LIGHT_AZIMUTH} elevation={LIGHT_ELEVATION} />
            </feSpecularLighting>
            <feComposite in="specular" in2="diffuse" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="lit" />
            <feColorMatrix in="lit" type="saturate" values="1.4" result="tinted" />
            <feComposite in="tinted" in2="SourceAlpha" operator="in" />
          </filter>
        ))}
        <filter
          id={TEXT_EMBOSS_FILTER_ID}
          x="-20%"
          y="-20%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.3" result="blur" />
          <feDiffuseLighting in="blur" surfaceScale="3" diffuseConstant="0.9" lightingColor="#000000" result="diffuse">
            <feDistantLight azimuth={LIGHT_AZIMUTH} elevation={LIGHT_ELEVATION} />
          </feDiffuseLighting>
          <feSpecularLighting
            in="blur"
            surfaceScale="-1.5"
            specularConstant="0.6"
            specularExponent="12"
            lightingColor="#FFFFFF"
            result="specular"
          >
            <feDistantLight azimuth={LIGHT_AZIMUTH} elevation={LIGHT_ELEVATION} />
          </feSpecularLighting>
          <feComposite in="specular" in2="diffuse" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="lit" />
          <feComposite in="lit" in2="SourceAlpha" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
