import {createRoot} from 'react-dom/client';
import {CompactLibrary} from './compact-library';
createRoot(document.getElementById('root')!).render(<CompactLibrary assetBase={import.meta.env.BASE_URL}/>);
