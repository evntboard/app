"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {TreeNodeType} from "@/types/tree-node";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

type Props = {
  options: { key: string, label: string}[],
  organizationId: string,
  scriptType?: 'trigger' | 'shared',
  scriptId?: string
}

export function TreeViewMobile(props: Props) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  useEffect(() => {
    if (props.scriptType && props.scriptId) {
      setValue(`${props.scriptType}:${props.scriptId}`)
    } else {
      setValue("")
    }
  }, [props.scriptType, props.scriptId])

  const handleItemClick = (currentValue: string) => {
    setValue(currentValue === value ? "" : currentValue)
    setOpen(false)

    const [type, id] = currentValue.split(':')

    router.push(`/organization/${props.organizationId}/script/${type}/${id}`)
  }


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? props.options.find((option) => option.key === value)?.label
            : "Select Script..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search a script ..." />
          <CommandEmpty>No Script found.</CommandEmpty>
          <CommandGroup>
            {props.options.map((option) => (
              <CommandItem
                key={option.key}
                value={option.key}
                onSelect={handleItemClick}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.key ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
