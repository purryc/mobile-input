import React from 'react';import {createRoot} from 'react-dom/client';
import {role} from './runtime';import {Tablet} from './tablet';import {Phone} from './phone';import './style.css';import './replica.css';import './interaction.css';import {ConnectionAccess} from './connection-access';import './connection-access.css';
createRoot(document.getElementById('root')!).render(<ConnectionAccess>{role==='phone'?<Phone/>:<Tablet/>}</ConnectionAccess>);
