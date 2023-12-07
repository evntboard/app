"use client"
import React, {Fragment, useRef, useState} from 'react'
import {useVirtual} from '@tanstack/react-virtual'
import {
  ColumnDef,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable
} from "@tanstack/react-table"

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {Icons} from "@/components/icons";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  getRowId?: ((originalRow: TData, index: number, parent?: Row<TData> | undefined) => string) | undefined,
  getRowCanExpand?: (row: Row<TData>) => boolean,
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement,
  singleExpand?: boolean,
  defaultSorting?: SortingState
}

export function DataTable<TData, TValue>({
                                           columns,
                                           data,
                                           getRowCanExpand,
                                           getRowId,
                                           renderSubComponent,
                                           singleExpand,
                                           defaultSorting
                                         }: DataTableProps<TData, TValue>) {
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [sorting, setSorting] = useState<SortingState>(defaultSorting ?? [])

  const onExpandedChange = (fnc: any) => {
    if (singleExpand) {
      if (fnc(expanded) === expanded) {
        setExpanded({})
      } else {
        setExpanded(fnc({}))
      }
    } else {
      setExpanded(fnc(expanded))
    }
  }

  const table = useReactTable({
    state: {
      expanded,
      sorting,
    },
    onSortingChange: setSorting,
    onExpandedChange: onExpandedChange,
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand,
    getRowId: getRowId
  })

  const tableContainerRef = useRef(null)

  const {rows} = table.getRowModel()
  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    overscan: 25
  })
  const {virtualItems: virtualRows, totalSize} = rowVirtualizer

  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0

  return (
    <div ref={tableContainerRef} className="rounded-md border overflow-auto" style={{height: "100%"}}>
      <Table>
        <TableHeader className="bg-secondary">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="sticky top-0">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    {...{
                      className: header.column.getCanSort()
                        ? 'cursor-pointer select-none'
                        : '',
                      onClick: header.column.getToggleSortingHandler(),
                    }}
                  >
                    <div className="flex gap-2 justify-between items-center">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      {{
                        asc: <Icons.sortDown />,
                        desc: <Icons.sortUp />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {paddingTop > 0 && (
            <tr>
              <td style={{height: `${paddingTop}px`}}/>
            </tr>
          )}
          {virtualRows.map(virtualRow => {
            const row = rows[virtualRow.index]
            return (
              <Fragment key={row.id}>
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map(cell => {
                    return (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow style={{paddingLeft: 24}}>
                    <TableCell colSpan={row.getVisibleCells().length}>
                      {renderSubComponent?.({row})}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{height: `${paddingBottom}px`}}/>
            </tr>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
