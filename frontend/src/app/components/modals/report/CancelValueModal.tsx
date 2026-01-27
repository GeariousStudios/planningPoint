import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import ModalBase from "./../ModalBase";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const CancelValueModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- States ---
  const [isSaving, setIsSaving] = useState(false);

  const requestDelete = () => {
    props.onConfirm();
  };

  return (
    <>
      {props.isOpen && (
        <ModalBase
          isOpen={props.isOpen}
          onClose={() => props.onClose()}
          icon={ExclamationTriangleIcon}
          label={t("CancelValueModal/Label")}
          smallModal
        >
          <ModalBase.Content>
            <p>{t("CancelValueModal/Message")}</p>
          </ModalBase.Content>

          <ModalBase.Footer>
            <button
              type="button"
              onClick={props.onClose}
              className={`${buttonPrimaryClass} xs:col-span-2 col-span-3`}
            >
              {t("CancelValueModal/Continue")}
            </button>
            <button
              type="button"
              onClick={requestDelete}
              className={`${buttonSecondaryClass} xs:col-span-1 col-span-3`}
            >
              {t("Common/Cancel")}
            </button>
          </ModalBase.Footer>
        </ModalBase>
      )}
    </>
  );
};

export default CancelValueModal;
