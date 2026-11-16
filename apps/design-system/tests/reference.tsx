// QA only: original application cascade, with no documentation or generated reset CSS.
// This detects documentation leakage; live-product comparisons separately validate host ancestry.
import {createRoot} from 'react-dom/client';
import {PreviewHost,Specimen} from '../src/specimens';
import '../../../packages/ui/src/phone-live-workbuddy.css';
import '../../../packages/ui/src/ai-polish.css';
import '../../web/src/style.css';
import '../../web/src/replica.css';
import '../../web/src/interaction.css';
import '../../web/src/phone-wechat-layout.css';
import '../src/preview-layout.css';
const name=new URLSearchParams(location.search).get('component')||'MediaControls';
createRoot(document.getElementById('root')!).render(<PreviewHost name={name}><Specimen name={name}/></PreviewHost>);
