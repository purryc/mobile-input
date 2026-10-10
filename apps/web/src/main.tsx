import React from 'react';import {createRoot} from 'react-dom/client';
import {WorkBuddyFileWindow} from './workbuddy-file-window';
import {role} from './runtime';import {Tablet} from './tablet';import {Phone} from './phone';import './style.css';import './replica.css';import './interaction.css';import {ConnectionAccess} from './connection-access';import './connection-access.css';import './phone-wechat-layout.css';
createRoot(document.getElementById('root')!).render(role==='filebrowser'?<WorkBuddyFileWindow/>:<ConnectionAccess>{role==='phone'?<Phone/>:<Tablet/>}</ConnectionAccess>);
