import {expect,type Page} from '@playwright/test';
/** Real explicit entry followed by the new phone confirmation; no state bypass. */
export async function enableInput(tablet:Page,phone:Page){await tablet.getByRole('button',{name:'虚拟键盘',exact:true}).click();await phone.getByRole('button',{name:'开始使用',exact:true}).click();await tablet.getByRole('button',{name:'收起虚拟键盘',exact:true}).click();await expect(phone.locator('.desktop-phone')).toBeVisible();}
