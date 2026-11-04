import {expect,type Page} from '@playwright/test';
/** Paired authority immediately exposes the desktop; keyboard entry stays idempotent. */
export async function enableInput(tablet:Page,phone:Page){await tablet.getByRole('button',{name:'虚拟键盘',exact:true}).click();await expect(phone.getByRole('button',{name:'开始使用',exact:true})).toHaveCount(0);await tablet.getByRole('button',{name:'收起虚拟键盘',exact:true}).click();await expect(phone.locator('.desktop-phone')).toBeVisible();}
