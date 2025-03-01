import { File, Folder, Tree } from '@connnect/ui/components/magicui/file-tree'

export function ConnectionTree() {
  return (
    <Tree
      initialSelectedId="7"
      initialExpandedItems={[
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
      ]}
    >
      <Folder element="src" value="1">
        <Folder value="2" element="app">
          <File value="3">
            <p>layout.tsx</p>
          </File>
          <File value="4">
            <p>page.tsx</p>
          </File>
        </Folder>
        <Folder value="5" element="components">
          <Folder value="6" element="ui">
            <File value="7">
              <p>button.tsx</p>
            </File>
          </Folder>
          <File value="8">
            <p>header.tsx</p>
          </File>
          <File value="9">
            <p>footer.tsx</p>
          </File>
        </Folder>
        <Folder value="10" element="lib">
          <File value="11">
            <p>utils.ts</p>
          </File>
        </Folder>
      </Folder>
    </Tree>
  )
}
