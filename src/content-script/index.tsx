import { Octokit } from '@octokit/rest'
import { render } from 'preact'
import '../base.css'
import { getUserConfig, Theme } from '../config'
import { detectSystemColorScheme } from '../utils'
import ChatGPTContainer from './ChatGPTContainer'
import { config, SearchEngine } from './search-engine-configs'
import './styles.scss'
import { getPossibleElementByQuerySelector } from './utils'

async function mount(question: string, promptSource: string, siteConfig: SearchEngine) {
  const container = document.createElement('div')
  container.className = 'chat-gpt-container'

  const userConfig = await getUserConfig()
  let theme: Theme
  if (userConfig.theme === Theme.Auto) {
    theme = detectSystemColorScheme()
  } else {
    theme = userConfig.theme
  }
  if (theme === Theme.Dark) {
    container.classList.add('gpt-dark')
  } else {
    container.classList.add('gpt-light')
  }

  // TODO: append different data paths to sidebarContainer's to place boxes in different diff files
  const siderbarContainer = getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery)
  console.log('siderbarContainer: ' + siderbarContainer)
  if (siderbarContainer) {
    siderbarContainer.prepend(container)
  } else {
    container.classList.add('sidebar-free')
    const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
    if (appendContainer) {
      // TODO: potentially swap these for github so box is above files?
      appendContainer.appendChild(container)
    }
  }

  render(
    <ChatGPTContainer
      question={question}
      promptSource={promptSource}
      triggerMode={userConfig.triggerMode || 'always'}
    />,
    container,
  )
}

/**
 * mount html elements when requestions triggered
 * @param question question string
 * @param index question index
 */
export async function requeryMount(question: string, index: number) {
  const container = document.querySelector<HTMLDivElement>('.question-container')
  let theme: Theme
  const questionItem = document.createElement('div')
  questionItem.className = `question-${index}`

  const userConfig = await getUserConfig()
  if (userConfig.theme === Theme.Auto) {
    theme = detectSystemColorScheme()
  } else {
    theme = userConfig.theme
  }
  if (theme === Theme.Dark) {
    container?.classList.add('gpt-dark')
    questionItem.classList.add('gpt-dark')
  } else {
    container?.classList.add('gpt-light')
    questionItem.classList.add('gpt-light')
  }
  questionItem.innerText = `Q${index + 1} : ${question}`
  container?.appendChild(questionItem)
}

const siteRegex = new RegExp(Object.keys(config).join('|'))
const siteName = location.hostname.match(siteRegex)![0]
const siteConfig = config[siteName]

async function run() {
  const searchInput = getPossibleElementByQuerySelector<HTMLInputElement>(siteConfig.inputQuery)
  console.debug('Try to Mount ChatGPT on', siteName)

  if (siteConfig.bodyQuery) {
    // const bodyElement = getPossibleElementByQuerySelector(siteConfig.bodyQuery)
    // const bodyElement = 'I love pineapples'

    // Extract repo owner and name from URL
    const currentUrl = window.location.href
    const url_parts = currentUrl.split('/')
    const owner = url_parts[3]
    const repo = url_parts[4]
    const pr_number = Number(url_parts[6])
    const bodyElement = 'The best repo is ' + owner + '/' + repo + '/' + pr_number

    // Get diff
    const octokit = new Octokit()
    const { data: diff } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pr_number,
      mediaType: {
        format: 'diff',
      },
    })

    // Generate prompt
    console.log('Diff: ' + diff)

    // Split diff by file

    // TODO: add this file/data path as a parameter to `mount` and turn the rest into a for loop between all these elements.
    // The goal should be to mount a prompt for each file's diff on that file's respective header.
    // Then, figure out CSS so it doesn't look horrible.

    console.debug('bodyElement', bodyElement)

    // Note: by this point, the prompt should be finalized. The rest of the work is on cleaning it up,
    // running it through ChatGPT, and properly displaying the results.
    if (bodyElement) {
      //  && bodyElement.textContent
      // TODO: consider increasing this limit from 1500 to 2048
      const bodyInnerText = bodyElement.trim().replace(/\s+/g, ' ').substring(0, 1500) // .textContent
      console.log('Body: ' + bodyInnerText)
      const userConfig = await getUserConfig()

      const found = userConfig.promptOverrides.find(
        (override) => new URL(override.site).hostname === location.hostname,
      )
      const question = found?.prompt ?? userConfig.prompt
      const promptSource = found?.site ?? 'default'

      mount(question + bodyInnerText, promptSource, siteConfig)
    }
  }
}

run()

if (siteConfig.watchRouteChange) {
  siteConfig.watchRouteChange(run)
}
