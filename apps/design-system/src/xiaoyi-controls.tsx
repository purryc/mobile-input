import {createRoot} from 'react-dom/client';
import {CompactLibrary} from '../../../packages/input-controls/example/compact-library';
createRoot(document.getElementById('root')!).render(<CompactLibrary assetBase={import.meta.env.BASE_URL+'input-controls/'}/>);
