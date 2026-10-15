import {InputPointer} from './input-pointer';
import {NativePhotoOverlay} from './native-photo-overlay';
import {CaptureProducer} from './capture-producer';
import React from 'react';import {createRoot} from 'react-dom/client';
import {role} from './runtime';import {Tablet} from './tablet';import {Phone} from './phone';import './style.css';import './replica.css';import './interaction.css';import {ConnectionAccess} from './connection-access';import './connection-access.css';import './phone-wechat-layout.css';
createRoot(document.getElementById('root')!).render(<ConnectionAccess>{role==='phone'?<><Phone/><NativePhotoOverlay/></>:<><Tablet/><InputPointer/><CaptureProducer/></>}</ConnectionAccess>);
