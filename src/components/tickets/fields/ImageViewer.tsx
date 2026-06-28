import React from 'react';
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom"; // 🔥 Import du plugin de zoom
import "yet-another-react-lightbox/styles.css";

interface ImageViewerProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    image: string | null;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
    open,
    setOpen,
    image
}) => {
    if (!image) return null;

    return (
        <Lightbox
            open={open}
            close={() => setOpen(false)}
            slides={[{ src: image }]}
            plugins={[Zoom]} // 🔥 Activation du plugin
            zoom={{
                maxZoomPixelRatio: 5, // Niveau de zoom maximum (5x)
                zoomInMultiplier: 2,   // Puissance du zoom à chaque clic
                doubleTapDelay: 300,   // Rapidité requise pour le double-clic sur mobile
                doubleClickDelay: 300, // Rapidité requise pour le double-clic sur PC
            }}
            carousel={{
                finite: true, // Désactive le balayage infini puisqu'il n'y a qu'une image
            }}
        />
    );
};