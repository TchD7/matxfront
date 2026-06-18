import api from '../../api/apiClient';

export const handleExportTickets = async (params: any, setExporting: (val: boolean) => void, toast: any) => {
    setExporting(true);
    try {
        const response = await api.get('/api/v1/ticket-analytics/export/', {
            params: params,
            responseType: 'blob',
        });

        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `export_interventions_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast({
            title: 'Export réussi',
            description: 'Le fichier a été téléchargé.',
            status: 'success',
            duration: 3000,
        });

    } catch (err: any) {
        console.error(err);
        // Si c'est un blob d'erreur, on peut essayer de le convertir en texte pour voir le détail
        if (err.response?.data instanceof Blob) {
            const text = await err.response.data.text();
            console.error("Détail de l'erreur :", text);
        }

        toast({
            title: 'Erreur Export',
            description: 'Impossible de générer le fichier.',
            status: 'error',
            duration: 4000,
        });
    } finally {
        setExporting(false);
    }
};