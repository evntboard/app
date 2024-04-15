import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '~/utils/cn'
import { Button } from '~/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem, CommandList,
} from '~/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useMemo } from 'react'

export type ComboboxOptions = {
  value: string;
  label: string;
};

interface ComboboxProps {
  options: ComboboxOptions[];
  value?: string
  className?: string;
  placeholder?: string;
  onChange?: (event: string) => void;
}

export function ComboboxCreate({ options: defaultOptions, value, className, placeholder, onChange }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState<string>('')

  const options = useMemo(() =>{
    if (query !== "") {
      return [
        {
          value: query,
          label: query,
        },
        ...defaultOptions,
      ]
    }
    return defaultOptions
  }, [defaultOptions, query])

  return (
    <div className={cn('block', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            key={'combobox-trigger'}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value ? (
              <div className="relative mr-auto flex flex-grow flex-wrap items-center overflow-hidden">
                <span>
                  {options.find((item) => item.value === value)?.label}
                </span>
              </div>
            ) : (
              placeholder ?? 'Select Item...'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 max-w-sm p-0">
          <Command
            filter={(value, search) => {
              if (value && value.includes(search)) return 1
              return 0
            }}
          >
            <CommandList>
              <CommandInput
                placeholder={placeholder ?? 'Select item...'}
                value={query}
                onValueChange={(value: string) => setQuery(value)}
              />
              <CommandEmpty>
                {(options.length === 0) && <>No event found.</>}
              </CommandEmpty>
              <ScrollArea>
                <div className="max-h-80">
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.label}
                        value={option.label}
                        onSelect={() => {
                          if (onChange) {
                            onChange(option.value)
                          }
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === option.value
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}