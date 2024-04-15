import { TreeNodeAction, TreeNodeType } from '~/types/tree';
import { DeleteModal } from '~/components/tree/modals/delete';
import { DisableModal } from '~/components/tree/modals/disable';
import { DuplicateModal } from '~/components/tree/modals/duplicate';
import { EnableModal } from '~/components/tree/modals/enable';
import { MoveModal } from '~/components/tree/modals/move';
import { CreateSharedModal } from '~/components/tree/modals/create-shared';
import { CreateTriggerModal } from '~/components/tree/modals/create-trigger';
import { CreateConditionModal } from '~/components/tree/modals/create-condition';
import { ExportModal } from '~/components/tree/modals/export'
import { ImportModal } from '~/components/tree/modals/import'

type Props = {
  hasWriteAccess: boolean,
  organizationId: string,
  scriptType?: string,
  scriptId?: string,
  entity?: TreeNodeType,
  action?: TreeNodeAction,
  onClose: () => void
}

export const TreeViewModals = ({
                                 organizationId,
                                 scriptId,
                                 scriptType,
                                 entity,
                                 action,
                                 onClose
                               }: Props) => {

  if (!entity || !action) {
    return null;
  }

  return (
    <>
      <DeleteModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
        scriptType={scriptType}
        scriptId={scriptId}
      />
      <DisableModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <DuplicateModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <EnableModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <MoveModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <CreateSharedModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <CreateTriggerModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <CreateConditionModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <ExportModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <ImportModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
    </>
  );
};