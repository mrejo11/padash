'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {X} from 'lucide-react';
export default function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;dialog?.close();};},[]);
 return <dialog ref={ref} className={'modal '+(wide?'modal-wide':'')} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}} aria-label={title}><div className="modal-head"><div><span className="eyebrow">بازرگانی پاداش</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="بستن"><X/></button></div>{children}</dialog>;
}
