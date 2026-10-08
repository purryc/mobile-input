import React from 'react';import {createRoot} from 'react-dom/client';
import {role} from './runtime';import {Tablet} from './tablet';import {Phone} from './phone';import './style.css';import './replica.css';import './interaction.css';
createRoot(document.getElementById('root')!).render(role==='phone'?<Phone/>:<Tablet/>);
