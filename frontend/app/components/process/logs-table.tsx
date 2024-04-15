import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { DataTable } from '~/components/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Icons } from '~/components/icons';
import { Editor } from '~/components/editor';
import { Badge } from '~/components/ui/badge';
import { EventProcessLogsResponse } from '~/types/pocketbase';

const columnsLogs: ColumnDef<EventProcessLogsResponse>[] = [
  {
    accessorKey: 'date',
    header: 'Info',
    cell: ({ row: { original } }) => {
      if (!original?.created) {
        return null;
      }

      return format(original?.created, 'dd/MM/yyyy HH:mm:ss.SSSS');
    }
  },
  {
    accessorKey: 'log',
    header: 'Log',
    cell: ({ row: { original } }) => {
      switch (typeof original.log) {
        case 'boolean':
          if (original.log) {
            return (<Badge variant="success">ON</Badge>);
          } else {
            return (<Badge variant="destructive">OFF</Badge>);
          }
        case 'object':
          return (
            (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="icon">
                    <Icons.log className="mx-auto h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="h-full w-full max-w-[80%] max-h-[80%]">
                  <DialogHeader>
                    <DialogTitle>Log</DialogTitle>
                    <DialogDescription>
                    </DialogDescription>
                    <Editor
                      options={{
                        readOnly: true
                      }}
                      height="100%"
                      language="json"
                      value={JSON.stringify(original?.log, null, 2)}
                    />
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            )
          );
        default:
          return original.log;
      }
    }
  }
];

type Props = {
  data: EventProcessLogsResponse[],
  organizationId: string,
  eventId: string
}

export const LogsTable = (props: Props) => {
  return (
    <DataTable
      getRowId={((originalRow) => originalRow.id)}
      columns={columnsLogs}
      data={props.data}
    />
  );
};