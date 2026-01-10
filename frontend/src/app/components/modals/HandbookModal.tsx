"use client";

import { FormEvent, use, useEffect, useRef, useState } from "react";
import {
  PencilSquareIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import { useTranslations } from "next-intl";
import ModalBase from "./ModalBase";
import Message from "../common/Message";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  content: string;
};

const HandbookModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- States ---
  const [body, setBody] = useState<React.ReactNode>(null);

  // --- Handbook Content ---
  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    try {
      const body = t.rich(`Handbook/${props.content}/Body`, {
        p: (chunks) => <p>{chunks}</p>,
        b: (chunks) => <b>{chunks}</b>,
        i: (chunks) => <i>{chunks}</i>,
        ul: (chunks) => <ul className="list-disc pl-6">{chunks}</ul>,
        li: (chunks) => <li className="my-2">{chunks}</li>,
        br: () => <br />,
        hr: () => <hr className="w-[calc(100%+2rem)] text-(--border-tertiary) my-4 -mx-4" />,
        danger: (chunks: React.ReactNode) => (
          <span className="text-(--locked)">{chunks}</span>
        ),
        accent: (chunks: React.ReactNode) => (
          <span className="text-(--accent-color) uppercase">{chunks}</span>
        ),
      });

      setBody(body);
    } catch (error: any) {
      setBody(body);
    }
  }, [props.isOpen, props.content, t]);

  const title = t(`Handbook/${props.content}/Title`);

  return (
    <>
      {props.isOpen && (
        <ModalBase
          isOpen={props.isOpen}
          onClose={() => props.onClose()}
          icon={QuestionMarkCircleIcon}
          label={title}
          confirmOnClose
        >
          <ModalBase.Content>
            <div className="">{body}</div>
          </ModalBase.Content>

          <ModalBase.Footer>
            <button
              type="button"
              onClick={() => props.onClose()}
              className={`${buttonPrimaryClass} col-span-full`}
            >
              {t("Handbook/Common/Close handbook")}
            </button>
          </ModalBase.Footer>
        </ModalBase>
      )}
    </>
  );
};

export default HandbookModal;
