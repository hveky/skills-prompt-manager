const { clipboard, contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  skills: {
    list:      ()           => ipcRenderer.invoke('skills:list'),
    read:      (id)         => ipcRenderer.invoke('skills:read', id),
    write:     (id, c)      => ipcRenderer.invoke('skills:write', { id, content: c }),
    delete:    (id)         => ipcRenderer.invoke('skills:delete', id),
    listFiles: (id)         => ipcRenderer.invoke('skills:list-files', id),
    readFile:  (id, fp)     => ipcRenderer.invoke('skills:read-file', { id, filePath: fp }),
    writeFile: (id, fp, c)  => ipcRenderer.invoke('skills:write-file', { id, filePath: fp, content: c }),
  },
  prompts: {
    list:   ()              => ipcRenderer.invoke('prompts:list'),
    read:   (id)            => ipcRenderer.invoke('prompts:read', id),
    write:  (id, c)         => ipcRenderer.invoke('prompts:write', { id, content: c }),
    delete: (id)            => ipcRenderer.invoke('prompts:delete', id),
    rename: (o, n, c)       => ipcRenderer.invoke('prompts:rename', { oldId: o, newId: n, content: c }),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close:    () => ipcRenderer.invoke('window:close'),
  },
  clipboard: {
    writeText: (text) => clipboard.writeText(text),
  },
})
