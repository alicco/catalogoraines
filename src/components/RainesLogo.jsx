import React from 'react';

/**
 * RainesLogo Component
 * Renders the logo from the public assets.
 * Note: The logo is currently a high-fidelity raster embedded in SVG to ensure exact match with the original design.
 */
export const RainesLogo = ({ className, style, width, height, ...props }) => {
    return (
        <img
            src="/RainesNero.svg"
            alt="Raines Logo"
            width={width} // Default natural size or controlled by prop
            height={height}
            className={className}
            style={style}
            {...props}
        />
    );
};

export default RainesLogo;
