import {ApplicationActionChip} from './application-action-chip';
import {uiText} from './i18n';
import type {MacEditReview} from './mac-link';
import './agent-edit-review.css';
/** Target adapters provide the actual proposal and action identities, never a synthetic diff. */
export function AgentEditReviews({reviews,busy,unavailable,onAction}:{reviews:MacEditReview[];busy:boolean;unavailable:ReadonlySet<string>;onAction:(review:string,action:string)=>void}){
 const label={edit:'继续编辑',reject:'拒绝修改',accept:'接受修改'};
 return <div className="agent-edit-reviews" aria-label={uiText('修改建议')}>{reviews.map(review=><section className="agent-edit-review" key={review.id} aria-label={uiText('修改建议')}>
  {review.document&&<p className="agent-edit-document">{review.document}</p>}
  <div className="agent-edit-diff"><del aria-label={uiText('修改前')}>{review.before}</del><ins aria-label={uiText('修改后')}>{review.after}</ins></div>
  {review.truncated&&<p>{uiText('内容较长，请在电脑查看完整修改')}</p>}
  <div className="agent-edit-review-actions">{review.actions.map(action=><ApplicationActionChip key={action.id} className={'review-'+action.kind} disabled={busy||!action.enabled||unavailable.has(action.id)} onPointerDown={e=>e.preventDefault()} onClick={()=>onAction(review.id,action.id)}>{uiText(label[action.kind])}</ApplicationActionChip>)}</div>
 </section>)}</div>;
}
