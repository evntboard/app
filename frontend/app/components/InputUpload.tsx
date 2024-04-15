import { Accept, useDropzone } from 'react-dropzone-esm'
import { forwardRef } from 'react'

interface InputProps {
  onChange: (v: File | undefined) => void,
  value: File | undefined,
  accept?: Accept
}


const InputUpload = forwardRef(({ onChange, value, accept }: InputProps, ref: React.ForwardedRef<HTMLInputElement>) => {
  const handleOnDrop = (files: File[]) => {
    onChange(files?.[0])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: accept,
    multiple: false,
    onDrop: handleOnDrop,
  })


  return (
    <div>
      {value && (<div>{value.name}</div>)}
      <div className="space-y-2 grow">
        <div {...getRootProps()}>
          <input {...getInputProps()} name="avatar" ref={ref} />
          {
            isDragActive ?
              <p>Drop the files here ...</p> :
              <p>Drag n drop some files here, or click to select files</p>
          }
        </div>
      </div>
    </div>
  )
})

InputUpload.displayName = 'InputUpload'

export { InputUpload }